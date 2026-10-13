package com.hackathonos.backend.ai;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.common.error.BadGatewayException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import com.hackathonos.backend.common.security.RateLimiter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.Semaphore;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Unified AI Gateway.
 * Every feature calling an LLM routes through this service.
 * Enforces timeouts, retries, concurrency limiting, circuit breaking,
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
    private final Semaphore concurrencyLimiter;
    private final ObjectMapper objectMapper;

    public AiService(
            LlmClient llmClient,
            AiProperties properties,
            AiCircuitBreaker circuitBreaker,
            RateLimiter rateLimiter,
            BriefRepository briefRepository) {
        this.llmClient = llmClient;
        this.properties = properties;
        this.circuitBreaker = circuitBreaker;
        this.rateLimiter = rateLimiter;
        this.briefRepository = briefRepository;
        this.concurrencyLimiter = new Semaphore(properties.getMaxConcurrency(), true);
        this.objectMapper = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public boolean isConfigured() {
        return properties.isEnabled() && llmClient.isConfigured();
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

    /**
     * Executes text completion for a feature without room scope.
     */
    public String text(String feature, String system, String user) {
        return text(feature, null, null, system, user);
    }

    /**
     * Executes text completion for a feature with room scope and user context.
     */
    public String text(String feature, UUID roomId, UUID userId, String system, String user) {
        return chat(feature, roomId, userId, system, List.of(), user);
    }

    /**
     * Executes structured JSON completion for a feature without room scope.
     */
    public <T> T json(String feature, String system, String user, Class<T> clazz) {
        return json(feature, null, null, system, user, clazz);
    }

    /**
     * Executes structured JSON completion with automated 1-shot repair retry.
     */
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

        LlmResult result = executeWithGateways(request);
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

            LlmResult repaired = executeWithGateways(repairRequest);
            String repairedCleaned = extractJsonBlock(repaired.content());
            try {
                return objectMapper.readValue(repairedCleaned, clazz);
            } catch (Exception finalEx) {
                log.error("AI JSON repair failed for feature {}: {}", feature, finalEx.getMessage());
                throw new com.hackathonos.backend.common.error.AiOutputException("AI failed to output valid JSON: " + finalEx.getMessage(), finalEx);
            }
        }
    }

    /**
     * Multi-turn chat completion with gating and retries.
     */
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

        return executeWithGateways(request).content();
    }

    /**
     * Backwards compatible single-prompt completion.
     */
    public String complete(UUID userId, String prompt) {
        return text("default", null, userId, null, prompt);
    }

    /**
     * Backwards compatible image completion.
     */
    public String completeImage(UUID userId, String prompt, String mimeType, byte[] imageBytes) {
        verifyAiPolicyAndLimits(null, userId);
        String visionModel = properties.getModelDefault();
        LlmRequest request = new LlmRequest("vision", visionModel, null, List.of(LlmMessage.user(prompt)), 0.3, null, LlmResponseFormat.TEXT);
        return executeWithGateways(request).content();
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

        if (userId != null) {
            RateLimiter.RateLimitResult userRate = rateLimiter.tryAcquire(
                    "ai:user:" + userId,
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

    private LlmResult executeWithGateways(LlmRequest request) {
        if (!circuitBreaker.allowRequest()) {
            throw new BadGatewayException("AI_CIRCUIT_OPEN", "AI service temporarily unavailable due to recent errors. Failing fast.");
        }

        try {
            concurrencyLimiter.acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BadGatewayException("AI_FAILED", "AI execution interrupted while acquiring concurrency permit");
        }

        long start = System.currentTimeMillis();
        int attempt = 0;
        Exception lastException = null;

        try {
            while (attempt <= properties.getMaxRetries()) {
                attempt++;
                try {
                    LlmResult result = llmClient.chat(request);
                    circuitBreaker.recordSuccess();

                    long latency = System.currentTimeMillis() - start;
                    log.info("AI call: feature={}, model={}, latencyMs={}, promptTokens={}, completionTokens={}, totalTokens={}, outcome=SUCCESS",
                            request.featureTag(), request.model(), latency,
                            result.promptTokens() != null ? result.promptTokens() : 0,
                            result.completionTokens() != null ? result.completionTokens() : 0,
                            result.totalTokens() != null ? result.totalTokens() : 0);

                    return result;
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
            long latency = System.currentTimeMillis() - start;
            log.error("AI call: feature={}, model={}, latencyMs={}, outcome=FAILED, error={}",
                    request.featureTag(), request.model(), latency, lastException != null ? lastException.getMessage() : "Unknown");

            if (lastException instanceof RuntimeException re) throw re;
            throw new BadGatewayException("AI_FAILED", "AI provider call failed: " + (lastException != null ? lastException.getMessage() : "Unknown error"));
        } finally {
            concurrencyLimiter.release();
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
