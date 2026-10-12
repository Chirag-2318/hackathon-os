package com.hackathonos.backend.ai;

import com.hackathonos.backend.common.error.BadGatewayException;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;

/**
 * AI client communicating with Groq / OpenAI-compatible endpoint.
 * Never logs API keys, prompts, or image contents.
 */
@Component
public class GroqClient implements AiClient {

    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final String visionModel;
    private final int maxTokens;

    public GroqClient(
            @Value("${GROQ_API_KEY:${XAI_API_KEY:${app.ai.groq.api-key:}}}") String apiKey,
            @Value("${GROQ_BASE_URL:${XAI_BASE_URL:${app.ai.groq.base-url:https://api.groq.com/openai/v1}}}") String baseUrl,
            @Value("${GROQ_MODEL:${XAI_MODEL:${app.ai.groq.model:llama-3.3-70b-versatile}}}") String model,
            @Value("${GROQ_VISION_MODEL:${XAI_VISION_MODEL:${app.ai.groq.vision-model:}}}") String visionModel,
            @Value("${GROQ_MAX_TOKENS:${XAI_MAX_TOKENS:${app.ai.groq.max-tokens:6000}}}") int maxTokens
    ) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.baseUrl = baseUrl != null && !baseUrl.isBlank() ? baseUrl.trim() : "https://api.groq.com/openai/v1";
        this.model = model != null && !model.isBlank() ? model.trim() : "llama-3.3-70b-versatile";
        this.visionModel = visionModel != null && !visionModel.isBlank() ? visionModel.trim() : this.model;
        this.maxTokens = maxTokens > 0 ? maxTokens : 6000;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public String complete(String prompt) {
        return executeChatCompletion(this.model, List.of(Map.of("role", "user", "content", prompt)));
    }

    public String completeWithImage(String prompt, String mimeType, byte[] imageBytes) {
        String base64Data = Base64.getEncoder().encodeToString(imageBytes);
        String mime = (mimeType != null && !mimeType.isBlank()) ? mimeType : "image/png";

        List<Map<String, Object>> contentParts = List.of(
                Map.of("type", "text", "text", prompt),
                Map.of("type", "image_url", "image_url", Map.of("url", "data:" + mime + ";base64," + base64Data))
        );

        Map<String, Object> message = Map.of("role", "user", "content", contentParts);
        return executeChatCompletion(this.visionModel, List.of(message));
    }

    private String executeChatCompletion(String modelToUse, List<Map<String, Object>> messages) {
        if (!isConfigured()) {
            throw new BadGatewayException("AI_NOT_CONFIGURED", "The AI key is missing or invalid. Check GROQ_API_KEY in .env.");
        }

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(120));
        factory.setReadTimeout(Duration.ofSeconds(120));

        RestClient client = RestClient.builder()
                .requestFactory(factory)
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", modelToUse);
        payload.put("messages", messages);
        payload.put("temperature", 0.3);
        payload.put("max_tokens", maxTokens);

        try {
            Map<?, ?> response = client.post()
                    .uri("/chat/completions")
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

            if (response == null || !response.containsKey("choices")) {
                throw new BadGatewayException("AI_FAILED", "Invalid response from AI provider");
            }

            List<?> choices = (List<?>) response.get("choices");
            if (choices.isEmpty()) {
                throw new BadGatewayException("AI_FAILED", "AI provider returned empty choices");
            }

            Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
            Map<?, ?> message = (Map<?, ?>) firstChoice.get("message");
            if (message == null || message.get("content") == null) {
                throw new BadGatewayException("AI_FAILED", "AI provider returned null content");
            }

            return message.get("content").toString().trim();
        } catch (HttpStatusCodeException e) {
            HttpStatusCode status = e.getStatusCode();
            int statusCode = status.value();
            if (statusCode == 401 || statusCode == 403) {
                throw new BadGatewayException("AI_NOT_CONFIGURED", "The AI key is missing or invalid. Check GROQ_API_KEY in .env.");
            } else if (statusCode == 429) {
                throw new TooManyRequestsException("AI_RATE_LIMIT", "AI rate limit reached. Please try again later.");
            } else {
                throw new BadGatewayException("AI_FAILED", "AI request failed with status " + statusCode);
            }
        } catch (BadGatewayException | TooManyRequestsException e) {
            throw e;
        } catch (Exception e) {
            throw new BadGatewayException("AI_FAILED", "AI execution failed: " + (e.getMessage() != null ? e.getMessage() : "unknown error"));
        }
    }
}
