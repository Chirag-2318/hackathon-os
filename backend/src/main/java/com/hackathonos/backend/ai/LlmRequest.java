package com.hackathonos.backend.ai;

import java.util.List;

/**
 * Request payload for LLM client.
 */
public record LlmRequest(
        String featureTag,
        String model,
        String systemPrompt,
        List<LlmMessage> messages,
        Double temperature,
        Integer maxTokens,
        LlmResponseFormat responseFormat
) {}
