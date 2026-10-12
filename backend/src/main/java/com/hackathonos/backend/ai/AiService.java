package com.hackathonos.backend.ai;

import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Service orchestrating AI completions with rate limiting using the server-configured model.
 */
@Service
public class AiService {

    private final GroqClient groqClient;
    private final AiRateLimiter rateLimiter;
    private AiClient overrideClient;

    public AiService(GroqClient groqClient, AiRateLimiter rateLimiter) {
        this.groqClient = groqClient;
        this.rateLimiter = rateLimiter;
    }

    public void setOverrideClient(AiClient overrideClient) {
        this.overrideClient = overrideClient;
    }

    public boolean isConfigured() {
        return groqClient.isConfigured();
    }

    /**
     * Executes AI completion using the server key.
     * Enforces hourly rate limit per user.
     */
    public String complete(UUID userId, String prompt) {
        rateLimiter.checkAndRecord(userId);
        if (overrideClient != null) {
            return overrideClient.complete(prompt);
        }
        return groqClient.complete(prompt);
    }

    /**
     * Executes AI vision completion using the server key and vision model.
     */
    public String completeImage(UUID userId, String prompt, String mimeType, byte[] imageBytes) {
        rateLimiter.checkAndRecord(userId);
        return groqClient.completeWithImage(prompt, mimeType, imageBytes);
    }
}
