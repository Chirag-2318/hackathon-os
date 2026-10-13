package com.hackathonos.backend.ai;

/**
 * Pluggable client contract for interacting with LLM providers.
 */
public interface LlmClient {

    /**
     * Executes a chat completion against the LLM provider.
     */
    LlmResult chat(LlmRequest request);

    /**
     * Returns whether the client has credentials and is configured.
     */
    boolean isConfigured();

    /**
     * Returns the provider hostname (never secrets or keys).
     */
    String getProviderHost();

    /**
     * Returns default model identifier.
     */
    String getDefaultModel();
}
