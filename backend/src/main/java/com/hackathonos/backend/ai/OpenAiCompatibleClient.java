package com.hackathonos.backend.ai;

import com.hackathonos.backend.common.error.BadGatewayException;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.time.Duration;
import java.util.*;

/**
 * OpenAI-compatible HTTP client implementation of LlmClient.
 * Works uniformly with Groq, vLLM, SGLang, and other OpenAI-compatible completions endpoints.
 * Never logs keys, headers, or prompt contents.
 */
@Component
public class OpenAiCompatibleClient implements LlmClient {

    private final AiProperties properties;
    private final RestClient restClient;
    private final String providerHost;

    public OpenAiCompatibleClient(AiProperties properties) {
        this.properties = properties;

        String host = "unknown";
        try {
            URI uri = URI.create(properties.getBaseUrl());
            host = uri.getHost() != null ? uri.getHost() : "unknown";
        } catch (Exception ignored) {}
        this.providerHost = host;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(properties.getTimeoutSeconds()));
        requestFactory.setReadTimeout(Duration.ofSeconds(properties.getTimeoutSeconds()));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .baseUrl(properties.getBaseUrl())
                .defaultHeader("Authorization", "Bearer " + properties.getApiKey())
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public boolean isConfigured() {
        return properties.getApiKey() != null && !properties.getApiKey().isBlank();
    }

    @Override
    public String getProviderHost() {
        return providerHost;
    }

    @Override
    public String getDefaultModel() {
        return properties.getModelDefault();
    }

    @Override
    public LlmResult chat(LlmRequest request) {
        if (!isConfigured()) {
            throw new BadGatewayException("AI_NOT_CONFIGURED", "AI API key is missing. Check AI_API_KEY / GROQ_API_KEY.");
        }

        List<Map<String, Object>> messagesPayload = new ArrayList<>();
        if (request.systemPrompt() != null && !request.systemPrompt().isBlank()) {
            messagesPayload.add(Map.of("role", "system", "content", request.systemPrompt()));
        }

        if (request.messages() != null) {
            for (LlmMessage msg : request.messages()) {
                messagesPayload.add(Map.of("role", msg.role(), "content", msg.content()));
            }
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", request.model() != null ? request.model() : properties.getModelDefault());
        payload.put("messages", messagesPayload);
        payload.put("temperature", request.temperature() != null ? request.temperature() : 0.3);

        if (request.maxTokens() != null && request.maxTokens() > 0) {
            payload.put("max_tokens", request.maxTokens());
        }

        if (request.responseFormat() == LlmResponseFormat.JSON && properties.isJsonModeSupported()) {
            payload.put("response_format", Map.of("type", "json_object"));
        }

        Map<?, ?> response = restClient.post()
                .uri("/chat/completions")
                .body(payload)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("choices")) {
            throw new BadGatewayException("AI_FAILED", "Empty or invalid response from AI provider");
        }

        List<?> choices = (List<?>) response.get("choices");
        if (choices.isEmpty()) {
            throw new BadGatewayException("AI_FAILED", "AI provider returned 0 choices");
        }

        Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
        Map<?, ?> messageObj = (Map<?, ?>) firstChoice.get("message");
        String content = messageObj != null && messageObj.get("content") != null
                ? String.valueOf(messageObj.get("content")) : "";
        String finishReason = firstChoice.get("finish_reason") != null
                ? String.valueOf(firstChoice.get("finish_reason")) : null;

        Integer promptTokens = null;
        Integer completionTokens = null;
        Integer totalTokens = null;

        if (response.containsKey("usage")) {
            Map<?, ?> usage = (Map<?, ?>) response.get("usage");
            if (usage != null) {
                if (usage.get("prompt_tokens") instanceof Number n) promptTokens = n.intValue();
                if (usage.get("completion_tokens") instanceof Number n) completionTokens = n.intValue();
                if (usage.get("total_tokens") instanceof Number n) totalTokens = n.intValue();
            }
        }

        return new LlmResult(content, promptTokens, completionTokens, totalTokens, finishReason);
    }
}
