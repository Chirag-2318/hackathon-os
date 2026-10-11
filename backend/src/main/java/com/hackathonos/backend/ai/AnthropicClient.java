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
 * Anthropic Claude completion client using Spring RestClient.
 */
@Component
public class AnthropicClient {

    private final String baseUrl;
    private final String model;
    public AnthropicClient(
            @Value("${app.ai.anthropic.base-url:https://api.anthropic.com}") String baseUrl,
            @Value("${app.ai.anthropic.model:claude-3-5-haiku-20241022}") String model) {
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
                .defaultHeader("x-api-key", apiKey)
                .defaultHeader("anthropic-version", "2023-06-01")
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();

        Map<String, Object> payload = Map.of(
                "model", model,
                "max_tokens", 4000,
                "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        try {
            Map<?, ?> response = client.post()
                    .uri("/v1/messages")
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

            if (response == null || !response.containsKey("content")) {
                throw new BadGatewayException("AI_FAILED", "Invalid response from Anthropic");
            }

            List<?> contentList = (List<?>) response.get("content");
            if (contentList.isEmpty()) {
                throw new BadGatewayException("AI_FAILED", "Anthropic returned empty content");
            }

            Map<?, ?> firstBlock = (Map<?, ?>) contentList.get(0);
            if (firstBlock.get("text") == null) {
                throw new BadGatewayException("AI_FAILED", "Anthropic returned null text");
            }

            return firstBlock.get("text").toString().trim();
        } catch (BadGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new BadGatewayException("AI_FAILED", "Anthropic error: " + e.getMessage());
        }
    }
}
