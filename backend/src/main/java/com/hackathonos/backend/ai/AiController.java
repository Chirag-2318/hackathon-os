package com.hackathonos.backend.ai;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint reporting AI Gateway health and configuration metadata.
 */
@RestController
@RequestMapping("/api/v1/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    public record AiStatusResponse(
            boolean enabled,
            boolean healthy,
            String provider,
            String model
    ) {}

    @GetMapping("/status")
    public AiStatusResponse getStatus() {
        boolean enabled = aiService.getProperties().isEnabled() && aiService.isConfigured();
        boolean healthy = aiService.getCircuitBreaker().isHealthy();
        String provider = aiService.getClient().getProviderHost();
        String model = aiService.getProperties().getModelDefault();
        return new AiStatusResponse(enabled, healthy, provider, model);
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

    @org.springframework.web.bind.annotation.PostMapping("/suggest-room-name")
    public SuggestRoomNameResponse suggestRoomName(@org.springframework.web.bind.annotation.RequestBody(required = false) SuggestRoomNameRequest request) {
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

        java.util.List<String> rawNames = null;
        try {
            NamingResult result = aiService.json("naming.suggest", systemPrompt, userPrompt.toString(), NamingResult.class);
            if (result != null && result.names() != null) {
                rawNames = result.names();
            }
        } catch (Exception e) {
            // Handled by fallback below
        }

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
