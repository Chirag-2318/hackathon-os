package com.hackathonos.backend.ai;

/**
 * Result returned by an LlmClient implementation.
 */
public record LlmResult(
        String content,
        Integer promptTokens,
        Integer completionTokens,
        Integer totalTokens,
        String finishReason
) {}
