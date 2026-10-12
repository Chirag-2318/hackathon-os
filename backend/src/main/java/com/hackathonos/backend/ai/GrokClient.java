package com.hackathonos.backend.ai;

import org.springframework.stereotype.Component;

/**
 * GrokClient compatible delegate wrapping GroqClient.
 */
@Component
public class GrokClient {

    private final GroqClient delegate;

    public GrokClient(GroqClient delegate) {
        this.delegate = delegate;
    }

    public boolean isConfigured() {
        return delegate.isConfigured();
    }

    public String complete(String prompt) {
        return delegate.complete(prompt);
    }

    public String completeWithImage(String prompt, String mimeType, byte[] imageBytes) {
        return delegate.completeWithImage(prompt, mimeType, imageBytes);
    }
}
