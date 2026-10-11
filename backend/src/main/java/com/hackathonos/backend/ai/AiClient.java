package com.hackathonos.backend.ai;

/**
 * Common contract for LLM completion providers.
 */
public interface AiClient {
    String complete(String prompt);
}
