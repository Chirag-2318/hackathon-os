package com.hackathonos.backend.ai;

/**
 * Pluggable client contract for interacting with LLM providers.
 */
public interface LlmClient {

    /**
     * Executes a chat completion against the LLM provider using the given API key.
     */
    LlmResult chat(LlmRequest request, String apiKey);

    /**
     * Executes a chat completion against the LLM provider.
     */
    default LlmResult chat(LlmRequest request) {
        return chat(request, null);
    }


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
