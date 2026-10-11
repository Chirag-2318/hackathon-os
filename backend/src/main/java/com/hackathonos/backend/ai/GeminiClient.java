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
 * Google Gemini completion client using Spring RestClient.
 */
@Component
public class GeminiClient {

    private final String baseUrl;
    private final String model;
    public GeminiClient(
            @Value("${app.ai.gemini.base-url:https://generativelanguage.googleapis.com}") String baseUrl,
            @Value("${app.ai.gemini.model:gemini-1.5-flash}") String model) {
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
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();

        Map<String, Object> payload = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("maxOutputTokens", 4000)
        );

        try {
            Map<?, ?> response = client.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models/" + model + ":generateContent")
                            .queryParam("key", apiKey)
                            .build())
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

            if (response == null || !response.containsKey("candidates")) {
                throw new BadGatewayException("AI_FAILED", "Invalid response from Gemini");
            }

            List<?> candidates = (List<?>) response.get("candidates");
            if (candidates.isEmpty()) {
                throw new BadGatewayException("AI_FAILED", "Gemini returned empty candidates");
            }

            Map<?, ?> firstCandidate = (Map<?, ?>) candidates.get(0);
            Map<?, ?> content = (Map<?, ?>) firstCandidate.get("content");
            if (content == null || !content.containsKey("parts")) {
                throw new BadGatewayException("AI_FAILED", "Gemini returned invalid content parts");
            }

            List<?> parts = (List<?>) content.get("parts");
            if (parts.isEmpty()) {
                throw new BadGatewayException("AI_FAILED", "Gemini returned empty parts");
            }

            Map<?, ?> firstPart = (Map<?, ?>) parts.get(0);
            if (firstPart.get("text") == null) {
                throw new BadGatewayException("AI_FAILED", "Gemini returned null text");
            }

            return firstPart.get("text").toString().trim();
        } catch (BadGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new BadGatewayException("AI_FAILED", "Gemini error: " + e.getMessage());
        }
    }
}
