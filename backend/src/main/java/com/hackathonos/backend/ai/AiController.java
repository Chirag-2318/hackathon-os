package com.hackathonos.backend.ai;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.dto.UserAiKeySummaryDto;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Endpoint reporting AI Gateway user key status, model definitions, daily usage, and latency test.
 */
@RestController
@RequestMapping
public class AiController {

    private final AiService aiService;
    private final UserAiKeyService userAiKeyService;
    private final AiUsageDailyRepository usageRepository;
    private final CurrentUser currentUser;

    private final Map<UUID, Instant> lastTestTimes = new ConcurrentHashMap<>();

    public AiController(AiService aiService,
                        UserAiKeyService userAiKeyService,
                        @org.springframework.beans.factory.annotation.Autowired(required = false)
                        AiUsageDailyRepository usageRepository,
                        CurrentUser currentUser) {
        this.aiService = aiService;
        this.userAiKeyService = userAiKeyService;
        this.usageRepository = usageRepository;
        this.currentUser = currentUser;
    }

    public record DailyUsageDto(
            String day,
            int calls,
            int failures
    ) {}

    public record AiStatusResponse(
            boolean keyConfigured,
            String keyStatus, // VALID, INVALID, RATE_LIMITED, UNVERIFIED, NOT_CONFIGURED
            String last4,
            String providerHost,
            String defaultModel,
            String fastModel,
            String smartModel,
            boolean jsonModeSupported,
            Boolean lastCallOk,
            List<DailyUsageDto> usage
    ) {}

    public record AiTestResponse(
            boolean ok,
            Long latencyMs,
            String error
    ) {}

    @GetMapping({"/api/v1/ai/status", "/ai/status"})
    public AiStatusResponse getStatus() {
        AiProperties props = aiService.getProperties();
        UUID userId = currentUser.getOptional().map(User::getId).orElse(null);

        UserAiKeySummaryDto keySummary = userAiKeyService.getKeySummary(userId);
        boolean keyConfigured = keySummary.hasKey() || props.isDevPlatformFallbackAllowed();
        String keyStatus = keySummary.status() != null ? keySummary.status() : (keyConfigured ? "VALID" : "NOT_CONFIGURED");
        String last4 = keySummary.last4();

        String providerHost = extractHost(props.getBaseUrl(), "api.groq.com");
        String defaultModel = props.getModelDefault();
        String fastModel = props.getModelFast();
        String smartModel = props.getModelSmart();
        boolean jsonMode = props.isJsonModeSupported();
        Boolean lastCallOk = aiService.getLastCallOk(userId);

        // 7-day usage breakdown for current user
        List<DailyUsageDto> usageList = new ArrayList<>();
        if (userId != null && usageRepository != null) {
            LocalDate today = LocalDate.now();
            LocalDate sevenDaysAgo = today.minusDays(6);
            List<AiUsageDaily> rows = usageRepository.findByUserIdAndDayGreaterThanEqualOrderByDayAsc(userId, sevenDaysAgo);
            Map<LocalDate, AiUsageDaily> map = new HashMap<>();
            for (AiUsageDaily r : rows) {
                map.put(r.getDay(), r);
            }

            for (int i = 6; i >= 0; i--) {
                LocalDate d = today.minusDays(i);
                AiUsageDaily row = map.get(d);
                usageList.add(new DailyUsageDto(
                        d.toString(),
                        row != null ? row.getCalls() : 0,
                        row != null ? row.getFailures() : 0
                ));
            }
        }

        return new AiStatusResponse(
                keyConfigured,
                keyStatus,
                last4,
                providerHost,
                defaultModel,
                fastModel,
                smartModel,
                jsonMode,
                lastCallOk,
                usageList
        );
    }

    @PostMapping({"/api/v1/ai/status/test", "/ai/status/test"})
    public AiTestResponse testConnection() {
        User user = currentUser.getOptional().orElse(null);
        UUID userId = user != null ? user.getId() : null;

        if (userId != null) {
            Instant now = Instant.now();
            Instant last = lastTestTimes.get(userId);
            if (last != null && ChronoUnit.SECONDS.between(last, now) < 60) {
                long wait = 60 - ChronoUnit.SECONDS.between(last, now);
                return new AiTestResponse(false, null, "Rate limit reached. Please wait " + wait + "s before testing again.");
            }
            lastTestTimes.put(userId, now);
        }

        if (!aiService.getProperties().isEnabled()) {
            return new AiTestResponse(false, null, "AI features are disabled by server configuration.");
        }

        try {
            long latencyMs = aiService.ping(userId);
            return new AiTestResponse(true, latencyMs, null);
        } catch (Exception ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) {
                msg = "Connection test failed: unable to reach AI gateway.";
            } else if (msg.contains("401") || msg.contains("Unauthorized") || msg.contains("invalid_api_key")) {
                msg = "Invalid AI API key or unauthorized gateway credentials.";
            } else if (msg.contains("circuit")) {
                msg = "AI gateway circuit is temporarily open due to recent upstream failures.";
            }
            return new AiTestResponse(false, null, msg);
        }
    }

    private String extractHost(String url, String fallback) {
        if (url == null || url.isBlank()) return fallback;
        try {
            URI uri = URI.create(url);
            String h = uri.getHost();
            return (h != null && !h.isBlank()) ? h : fallback;
        } catch (Exception e) {
            return fallback;
        }
    }

    public record SuggestRoomNameRequest(
            String description,
            String templateId,
            String currentName
    ) {}

    public record SuggestRoomNameResponse(
            java.util.List<String> names
    ) {}

    public record NamingResult(java.util.List<String> names) {}

    @PostMapping("/api/v1/ai/suggest-room-name")
    public SuggestRoomNameResponse suggestRoomName(@RequestBody(required = false) SuggestRoomNameRequest request) {
        User user = currentUser.get();

        String systemPrompt = "You are a creative naming assistant for hackathon teams and project workspaces. " +
                "Generate exactly 3 short, punchy, original, non-cringe hackathon team or project names. " +
                "Rules:\n" +
                "- Max 28 characters each.\n" +
                "- No emojis.\n" +
                "- No numbering (do not prefix with 1., 2., etc.).\n" +
                "- Valid JSON only: {\"names\": [\"Name One\", \"Name Two\", \"Name Three\"]}";

        StringBuilder userPrompt = new StringBuilder("Suggest 3 hackathon project or team names.");
        if (request != null) {
            if (request.currentName() != null && !request.currentName().isBlank()) {
                userPrompt.append(" Current name: ").append(request.currentName().trim());
            }
            if (request.description() != null && !request.description().isBlank()) {
                userPrompt.append(" Description: ").append(request.description().trim());
            }
            if (request.templateId() != null && !request.templateId().isBlank()) {
                userPrompt.append(" Event type/template: ").append(request.templateId().trim());
            }
        }

        NamingResult result = aiService.json("naming.suggest", null, user.getId(), systemPrompt, userPrompt.toString(), NamingResult.class);

        java.util.List<String> rawNames = result != null ? result.names() : null;
        java.util.List<String> cleanedNames = new java.util.ArrayList<>();
        if (rawNames != null) {
            for (String raw : rawNames) {
                if (raw == null) continue;
                String cleaned = raw.replaceAll("^[0-9]+[.\\-\\s]+", "").replaceAll("[\\p{So}\\p{Cn}]", "").trim();
                if (cleaned.length() > 28) {
                    cleaned = cleaned.substring(0, 28).trim();
                }
                if (!cleaned.isBlank() && !cleanedNames.contains(cleaned)) {
                    cleanedNames.add(cleaned);
                }
                if (cleanedNames.size() == 3) break;
            }
        }

        java.util.List<String> fallbacks = java.util.List.of("HyperSprint", "NovaForge", "PulseStack", "CyberCanvas", "VortexLab", "ApexFlow");
        for (String fb : fallbacks) {
            if (cleanedNames.size() >= 3) break;
            if (!cleanedNames.contains(fb)) {
                cleanedNames.add(fb);
            }
        }

        return new SuggestRoomNameResponse(cleanedNames);
    }
}
