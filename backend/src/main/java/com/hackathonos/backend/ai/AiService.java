package com.hackathonos.backend.ai;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.common.error.*;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.common.security.RateLimiter;
import com.hackathonos.backend.users.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Unified AI Gateway.
 * Every feature calling an LLM routes through this service.
 * Enforces per-user API key resolution (BYOK), timeouts, retries,
 * per-user concurrency limiting (2 max), circuit breaking,
 * Brief event policy checks, structured JSON parsing with 1-shot repair, and structured logging.
 */
@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final LlmClient llmClient;
    private final AiProperties properties;
    private final AiCircuitBreaker circuitBreaker;
    private final RateLimiter rateLimiter;
    private final BriefRepository briefRepository;
    private final UserAiKeyService userAiKeyService;
    private final CurrentUser currentUser;
    private final Semaphore concurrencyLimiter;
    private final ConcurrentHashMap<UUID, Semaphore> userConcurrencyLimiters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, Boolean> lastCallOkMap = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final AiUsageDailyRepository usageRepository;

    public AiService(
            LlmClient llmClient,
            AiProperties properties,
            AiCircuitBreaker circuitBreaker,
            RateLimiter rateLimiter,
            BriefRepository briefRepository,
            UserAiKeyService userAiKeyService,
            CurrentUser currentUser,
            @org.springframework.beans.factory.annotation.Autowired(required = false)
            AiUsageDailyRepository usageRepository) {
        this.llmClient = llmClient;
        this.properties = properties;
        this.circuitBreaker = circuitBreaker;
        this.rateLimiter = rateLimiter;
        this.briefRepository = briefRepository;
        this.userAiKeyService = userAiKeyService;
        this.currentUser = currentUser;
        this.usageRepository = usageRepository;
        this.concurrencyLimiter = new Semaphore(properties.getMaxConcurrency(), true);
        this.objectMapper = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public boolean isConfigured() {
        UUID userId = currentUser.getOptional().map(User::getId).orElse(null);
        return isConfigured(userId);
    }

    public boolean isConfigured(UUID userId) {
        if (!properties.isEnabled()) return false;
        if (userId != null) {
            return userAiKeyService.getKeySummary(userId).hasKey() || properties.isDevPlatformFallbackAllowed();
        }
        return properties.isDevPlatformFallbackAllowed();
    }

    public Boolean getLastCallOk(UUID userId) {
        return userId != null ? lastCallOkMap.get(userId) : null;
    }

    public LlmClient getClient() {
        return llmClient;
    }

    public AiProperties getProperties() {
        return properties;
    }

    public AiCircuitBreaker getCircuitBreaker() {
        return circuitBreaker;
    }

    public String text(String feature, String system, String user) {
        return text(feature, null, null, system, user);
    }

    public String text(String feature, UUID roomId, UUID userId, String system, String user) {
        return chat(feature, roomId, userId, system, List.of(), user);
    }

    public <T> T json(String feature, String system, String user, Class<T> clazz) {
        return json(feature, null, null, system, user, clazz);
    }

    public <T> T json(String feature, UUID roomId, UUID userId, String system, String user, Class<T> clazz) {
        verifyAiPolicyAndLimits(roomId, userId);

        String systemPrompt = (system != null ? system : "") + "\nYou MUST return valid JSON only. Do not include explanatory conversational text.";
        String model = properties.resolveModel(feature);
        double temp = properties.resolveTemperature(feature);

        LlmRequest request = new LlmRequest(
                feature,
                model,
                systemPrompt,
                List.of(LlmMessage.user(user)),
                temp,
                null,
                LlmResponseFormat.JSON
        );

        LlmResult result = executeWithGateways(request, userId);
        String cleaned = extractJsonBlock(result.content());

        try {
            return objectMapper.readValue(cleaned, clazz);
        } catch (Exception parseEx) {
            log.warn("Initial JSON parse failed for feature={}, attempting 1-shot repair retry: {}", feature, parseEx.getMessage());
            String repairPrompt = "The following JSON is malformed or invalid: \n" + parseEx.getMessage()
                    + "\nRaw output was:\n" + result.content()
                    + "\nFix the error and output valid JSON only:";

            LlmRequest repairRequest = new LlmRequest(
                    feature + ".repair",
                    model,
                    systemPrompt,
                    List.of(LlmMessage.user(user), LlmMessage.assistant(result.content()), LlmMessage.user(repairPrompt)),
                    0.1,
                    null,
                    LlmResponseFormat.JSON
            );

            LlmResult repaired = executeWithGateways(repairRequest, userId);
            String repairedCleaned = extractJsonBlock(repaired.content());
            try {
                return objectMapper.readValue(repairedCleaned, clazz);
            } catch (Exception finalEx) {
                log.error("AI JSON repair failed for feature {}: {}", feature, finalEx.getMessage());
                throw new AiOutputException("AI failed to output valid JSON: " + finalEx.getMessage(), finalEx);
            }
        }
    }

    public String chat(String feature, UUID roomId, UUID userId, String system, List<LlmMessage> history, String user) {
        return chat(feature, roomId, userId, system, history, user, null);
    }

    public String chat(String feature, UUID roomId, UUID userId, String system, List<LlmMessage> history, String user, Integer maxTokens) {
        verifyAiPolicyAndLimits(roomId, userId);

        List<LlmMessage> messages = new ArrayList<>();
        if (history != null) {
            messages.addAll(history);
        }
        if (user != null && !user.isBlank()) {
            messages.add(LlmMessage.user(user));
        }

        String model = properties.resolveModel(feature);
        double temp = properties.resolveTemperature(feature);

        LlmRequest request = new LlmRequest(
                feature,
                model,
                system,
                messages,
                temp,
                maxTokens,
                LlmResponseFormat.TEXT
        );

        return executeWithGateways(request, userId).content();
    }

    public String complete(UUID userId, String prompt) {
        return text("default", null, userId, null, prompt);
    }

    public String completeImage(UUID userId, String prompt, String mimeType, byte[] imageBytes) {
        verifyAiPolicyAndLimits(null, userId);
        String visionModel = properties.getModelDefault();
        LlmRequest request = new LlmRequest("vision", visionModel, null, List.of(LlmMessage.user(prompt)), 0.3, null, LlmResponseFormat.TEXT);
        return executeWithGateways(request, userId).content();
    }

    private void verifyAiPolicyAndLimits(UUID roomId, UUID userId) {
        if (!properties.isEnabled()) {
            throw new BadGatewayException("AI_DISABLED", "AI features are currently disabled by server configuration");
        }

        if (roomId != null) {
            briefRepository.findByRoomId(roomId).ifPresent(brief -> {
                String policy = brief.getAiPolicy();
                if (policy != null && !policy.isBlank()) {
                    String up = policy.toUpperCase();
                    if (up.contains("FORBIDDEN") || up.contains("RESTRICTED") || up.contains("PROHIBITED")
                            || up.contains("NO_AI") || up.contains("DISALLOWED") || up.contains("BANNED")
                            || up.contains("NOT ALLOWED")) {
                        throw new ForbiddenException("AI_RESTRICTED_BY_EVENT", "AI use is restricted by this room's event brief policy.");
                    }
                }
            });

            rateLimiter.tryAcquire("ai:room:" + roomId, 20, 20, Duration.ofMinutes(1));
        }

        UUID actingUserId = userId != null ? userId : currentUser.getOptional().map(User::getId).orElse(null);
        if (actingUserId != null) {
            RateLimiter.RateLimitResult userRate = rateLimiter.tryAcquire(
                    "ai:user:" + actingUserId,
                    properties.getUserRatePerMinute(),
                    properties.getUserRatePerMinute(),
                    Duration.ofMinutes(1)
            );
            if (!userRate.allowed()) {
                throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                        "AI request rate limit reached. Try again in " + userRate.retryAfterSeconds() + " seconds.",
                        userRate.retryAfterSeconds());
            }
        }
    }

    public long ping(UUID userId) {
        long start = System.currentTimeMillis();
        chat("ai.ping", null, userId, "Respond with OK", List.of(), "ping", 8);
        return System.currentTimeMillis() - start;
    }

    private void recordUsage(UUID userId, boolean success) {
        if (userId == null || usageRepository == null) return;
        try {
            usageRepository.incrementUsage(userId, java.time.LocalDate.now(), success ? 0 : 1);
        } catch (Exception e) {
            log.debug("Failed to record daily AI usage: {}", e.getMessage());
        }
    }

    private record ResolvedUserKey(UUID userId, String apiKey) {}

    private ResolvedUserKey resolveUserAndKey(UUID explicitUserId) {
        UUID userId = explicitUserId != null ? explicitUserId : currentUser.getOptional().map(User::getId).orElse(null);

        if (userId != null) {
            Optional<String> keyOpt = userAiKeyService.getDecryptedKey(userId);
            if (keyOpt.isPresent() && !keyOpt.get().isBlank()) {
                return new ResolvedUserKey(userId, keyOpt.get().trim());
            }
        }

        if (properties.isDevPlatformFallbackAllowed()) {
            return new ResolvedUserKey(userId, properties.getPlatformFallbackKey());
        }

        throw new AiKeyMissingException("You haven't added your API key yet.");
    }

    private LlmResult executeWithGateways(LlmRequest request, UUID explicitUserId) {
        ResolvedUserKey resolved = resolveUserAndKey(explicitUserId);
        UUID actingUserId = resolved.userId();
        String apiKey = resolved.apiKey();

        if (!circuitBreaker.allowRequest()) {
            recordUsage(actingUserId, false);
            if (actingUserId != null) lastCallOkMap.put(actingUserId, false);
            throw new BadGatewayException("AI_CIRCUIT_OPEN", "AI service temporarily unavailable due to recent errors. Failing fast.");
        }

        Semaphore userLimiter = actingUserId != null
                ? userConcurrencyLimiters.computeIfAbsent(actingUserId, k -> new Semaphore(2, true))
                : null;

        boolean userAcquired = false;
        if (userLimiter != null) {
            userAcquired = userLimiter.tryAcquire();
            if (!userAcquired) {
                recordUsage(actingUserId, false);
                throw new TooManyRequestsException("USER_AI_CONCURRENCY_LIMIT", "Maximum of 2 simultaneous AI requests reached. Please wait for the current one to finish.", 1);
            }
        }

        try {
            concurrencyLimiter.acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            if (userAcquired && userLimiter != null) userLimiter.release();
            recordUsage(actingUserId, false);
            throw new BadGatewayException("AI_FAILED", "AI execution interrupted while acquiring concurrency permit");
        }

        long start = System.currentTimeMillis();
        int attempt = 0;
        Exception lastException = null;

        try {
            while (attempt <= properties.getMaxRetries()) {
                attempt++;
                try {
                    LlmResult result = llmClient.chat(request, apiKey);
                    circuitBreaker.recordSuccess();
                    recordUsage(actingUserId, true);
                    if (actingUserId != null) lastCallOkMap.put(actingUserId, true);

                    long latency = System.currentTimeMillis() - start;
                    log.info("AI call: feature={}, model={}, latencyMs={}, promptTokens={}, completionTokens={}, totalTokens={}, outcome=SUCCESS",
                            request.featureTag(), request.model(), latency,
                            result.promptTokens() != null ? result.promptTokens() : 0,
                            result.completionTokens() != null ? result.completionTokens() : 0,
                            result.totalTokens() != null ? result.totalTokens() : 0);

                    return result;
                } catch (AiKeyInvalidException ex) {
                    lastException = ex;
                    if (actingUserId != null) {
                        userAiKeyService.updateStatus(actingUserId, "INVALID", "Groq rejected API key");
                        lastCallOkMap.put(actingUserId, false);
                    }
                    recordUsage(actingUserId, false);
                    throw ex;
                } catch (AiKeyRateLimitedException ex) {
                    lastException = ex;
                    recordUsage(actingUserId, false);
                    if (actingUserId != null) lastCallOkMap.put(actingUserId, false);
                    if (ex.getRetryAfterSeconds() <= 3 && attempt <= properties.getMaxRetries()) {
                        try {
                            Thread.sleep(ex.getRetryAfterSeconds() * 1000L);
                            continue;
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw ex;
                        }
                    }
                    throw ex;
                } catch (AiKeyMissingException ex) {
                    lastException = ex;
                    throw ex;
                } catch (Exception ex) {
                    lastException = ex;
                    if (attempt <= properties.getMaxRetries()) {
                        long backoff = (long) Math.pow(2, attempt) * 500L + ThreadLocalRandom.current().nextInt(200);
                        try {
                            Thread.sleep(backoff);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
            }

            circuitBreaker.recordFailure();
            recordUsage(actingUserId, false);
            if (actingUserId != null) lastCallOkMap.put(actingUserId, false);
            long latency = System.currentTimeMillis() - start;
            log.error("AI call: feature={}, model={}, latencyMs={}, outcome=FAILED, error={}",
                    request.featureTag(), request.model(), latency, lastException != null ? lastException.getMessage() : "Unknown");

            if (lastException instanceof RuntimeException re) throw re;
            throw new BadGatewayException("AI_UNAVAILABLE", "AI provider call failed: " + (lastException != null ? lastException.getMessage() : "Unknown error"));
        } finally {
            concurrencyLimiter.release();
            if (userAcquired && userLimiter != null) {
                userLimiter.release();
            }
        }
    }

    public String transcribeAudio(UUID userId, String filename, byte[] audioBytes) {
        return transcribeAudio(userId, filename, audioBytes, null);
    }

    public String transcribeAudio(UUID userId, String filename, byte[] audioBytes, String promptHint) {
        ResolvedUserKey resolved = resolveUserAndKey(userId);
        String sttUrl = properties.getSttBaseUrl().replaceAll("/+$", "") + "/audio/transcriptions";

        RestClient sttClient = RestClient.builder().build();
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("model", properties.getSttModel());
        if (promptHint != null && !promptHint.isBlank()) {
            body.add("prompt", promptHint);
        }

        ByteArrayResource resource = new ByteArrayResource(audioBytes) {
            @Override
            public String getFilename() {
                return (filename != null && !filename.isBlank()) ? filename : "audio.webm";
            }
        };
        body.add("file", resource);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(resolved.apiKey());

        try {
            Map<?, ?> response = sttClient.post()
                    .uri(sttUrl)
                    .headers(h -> h.addAll(headers))
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("text")) {
                return String.valueOf(response.get("text")).trim();
            }
            return "";
        } catch (Exception e) {
            log.error("Audio transcription failed: {}", e.getMessage());
            throw new BadGatewayException("AI_UNAVAILABLE", "Audio transcription failed: " + e.getMessage());
        }
    }

    public static String extractJsonBlock(String raw) {
        if (raw == null) return "{}";
        String text = raw.trim();
        if (text.startsWith("```")) {
            int firstNewline = text.indexOf('\n');
            if (firstNewline != -1) text = text.substring(firstNewline + 1);
            int lastFence = text.lastIndexOf("```");
            if (lastFence != -1) text = text.substring(0, lastFence);
            text = text.trim();
        }
        int firstBrace = text.indexOf('{');
        int lastBrace = text.lastIndexOf('}');
        int firstBracket = text.indexOf('[');
        int lastBracket = text.lastIndexOf(']');

        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            if (firstBracket == -1 || firstBrace < firstBracket) {
                return text.substring(firstBrace, lastBrace + 1);
            }
        }
        if (firstBracket != -1 && lastBracket != -1 && lastBracket > firstBracket) {
            return text.substring(firstBracket, lastBracket + 1);
        }
        return text;
    }
}
