package com.hackathonos.backend.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Unified AI configuration properties mapped from exact environment variable specification.
 */
@Component
public class AiProperties {

    private final String baseUrl;
    private final String platformKey;
    private final boolean platformFallback;
    private final org.springframework.core.env.Environment environment;
    private final String modelDefault;
    private final String modelFast;
    private final String modelSmart;
    private final boolean jsonModeSupported;
    private final int timeoutSeconds;
    private final int maxRetries;
    private final int maxConcurrency;
    private final int userRatePerMinute;
    private final boolean enabled;
    private final String sttBaseUrl;
    private final String sttModel;

    public AiProperties(
            @Value("${AI_BASE_URL:${app.ai.base-url:https://api.groq.com/openai/v1}}") String baseUrl,
            @Value("${AI_PLATFORM_KEY:${AI_API_KEY:${GROQ_API_KEY:${app.ai.platform-key:}}}}") String platformKey,
            @Value("${AI_PLATFORM_FALLBACK:${app.ai.platform-fallback:false}}") boolean platformFallback,
            org.springframework.core.env.Environment environment,
            @Value("${AI_MODEL_DEFAULT:${GROQ_MODEL:${XAI_MODEL:${app.ai.model-default:llama-3.3-70b-versatile}}}}") String modelDefault,
            @Value("${AI_MODEL_FAST:${app.ai.model-fast:}}") String modelFast,
            @Value("${AI_MODEL_SMART:${app.ai.model-smart:}}") String modelSmart,
            @Value("${AI_JSON_MODE_SUPPORTED:${app.ai.json-mode-supported:true}}") boolean jsonModeSupported,
            @Value("${AI_TIMEOUT_SECONDS:${app.ai.timeout-seconds:45}}") int timeoutSeconds,
            @Value("${AI_MAX_RETRIES:${app.ai.max-retries:2}}") int maxRetries,
            @Value("${AI_MAX_CONCURRENCY:${app.ai.max-concurrency:4}}") int maxConcurrency,
            @Value("${AI_USER_RATE_PER_MINUTE:${app.ai.user-rate-per-minute:10}}") int userRatePerMinute,
            @Value("${AI_ENABLED:${app.ai.enabled:true}}") boolean enabled,
            @Value("${STT_BASE_URL:${app.ai.stt.base-url:https://api.groq.com/openai/v1}}") String sttBaseUrl,
            @Value("${STT_MODEL:${app.ai.stt.model:whisper-large-v3}}") String sttModel
    ) {
        this.baseUrl = baseUrl != null && !baseUrl.isBlank() ? baseUrl.trim() : "https://api.groq.com/openai/v1";
        this.platformKey = platformKey != null ? platformKey.trim() : "";
        this.platformFallback = platformFallback;
        this.environment = environment;
        this.modelDefault = modelDefault != null && !modelDefault.isBlank() ? modelDefault.trim() : "llama-3.3-70b-versatile";
        this.modelFast = modelFast != null && !modelFast.isBlank() ? modelFast.trim() : this.modelDefault;
        this.modelSmart = modelSmart != null && !modelSmart.isBlank() ? modelSmart.trim() : this.modelDefault;
        this.jsonModeSupported = jsonModeSupported;
        this.timeoutSeconds = timeoutSeconds > 0 ? timeoutSeconds : 45;
        this.maxRetries = maxRetries >= 0 ? maxRetries : 2;
        this.maxConcurrency = maxConcurrency > 0 ? maxConcurrency : 4;
        this.userRatePerMinute = userRatePerMinute > 0 ? userRatePerMinute : 10;
        this.enabled = enabled;
        this.sttBaseUrl = sttBaseUrl != null && !sttBaseUrl.isBlank() ? sttBaseUrl.trim() : this.baseUrl;
        this.sttModel = sttModel != null && !sttModel.isBlank() ? sttModel.trim() : "whisper-large-v3";
    }

    public boolean isDevPlatformFallbackAllowed() {
        if (environment == null) return false;
        boolean isDev = java.util.Arrays.asList(environment.getActiveProfiles()).contains("dev");
        return isDev && platformFallback && platformKey != null && !platformKey.isBlank();
    }

    public String getPlatformFallbackKey() {
        return isDevPlatformFallbackAllowed() ? platformKey : "";
    }

    public String getBaseUrl() { return baseUrl; }
    public String getApiKey() { return getPlatformFallbackKey(); }
    public boolean isPlatformFallback() { return platformFallback; }

    public String getModelDefault() { return modelDefault; }
    public String getModelFast() { return modelFast; }
    public String getModelSmart() { return modelSmart; }
    public boolean isJsonModeSupported() { return jsonModeSupported; }
    public int getTimeoutSeconds() { return timeoutSeconds; }
    public int getMaxRetries() { return maxRetries; }
    public int getMaxConcurrency() { return maxConcurrency; }
    public int getUserRatePerMinute() { return userRatePerMinute; }
    public boolean isEnabled() { return enabled; }
    public String getSttBaseUrl() { return sttBaseUrl; }
    public String getSttApiKey() { return getPlatformFallbackKey(); }
    public String getSttModel() { return sttModel; }

    public double resolveTemperature(String featureTag) {
        if (featureTag == null) return 0.3;
        String tag = featureTag.toLowerCase();
        if (tag.startsWith("plan.analysis.")) return 0.3;
        if (tag.startsWith("plan.generate.")) return 0.4;
        if (tag.contains("naming") || tag.contains("suggest")) return 0.85;
        if (tag.contains("pitch") && !tag.contains("qa")) return 0.6;
        if (tag.contains("plan") || tag.contains("prd") || tag.contains("tasks") || tag.contains("json")) return 0.2;
        return 0.3;
    }

    public String resolveModel(String featureTag) {
        if (featureTag == null) return modelDefault;
        String tag = featureTag.toLowerCase();
        if (tag.contains("naming") || tag.contains("extract")) return modelFast;
        if (tag.contains("pitch") || tag.contains("qa") || tag.contains("judge")) return modelSmart;
        return modelDefault;
    }
}
