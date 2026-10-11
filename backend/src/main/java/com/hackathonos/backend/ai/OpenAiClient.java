package com.hackathonos.backend.ai;

import com.hackathonos.backend.common.error.BadGatewayException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * OpenAI completion client using Spring RestClient.
 */
@Component
public class OpenAiClient {

    private final String baseUrl;
    private final String model;
    public OpenAiClient(
            @Value("${app.ai.openai.base-url:https://api.openai.com}") String baseUrl,
            @Value("${app.ai.openai.model:gpt-4o-mini}") String model) {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    public String completeWithKey(String apiKey, String prompt) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(60));
        factory.setReadTimeout(Duration.ofSeconds(60));

        RestClient client = RestClient.builder()
                .requestFactory(factory)
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();

        Map<String, Object> payload = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "max_tokens", 4000
        );

        try {
            Map<?, ?> response = client.post()
                    .uri("/v1/chat/completions")
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

            if (response == null || !response.containsKey("choices")) {
                throw new BadGatewayException("AI_FAILED", "Invalid response from OpenAI");
            }

            List<?> choices = (List<?>) response.get("choices");
            if (choices.isEmpty()) {
                throw new BadGatewayException("AI_FAILED", "OpenAI returned empty choices");
            }

            Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
            Map<?, ?> message = (Map<?, ?>) firstChoice.get("message");
            if (message == null || message.get("content") == null) {
                throw new BadGatewayException("AI_FAILED", "OpenAI returned null content");
            }

            return message.get("content").toString().trim();
        } catch (BadGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new BadGatewayException("AI_FAILED", "OpenAI error: " + e.getMessage());
        }
    }
}
