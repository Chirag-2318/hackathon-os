package com.hackathonos.backend.github.client;

import java.time.Instant;

public class GitHubApiException extends RuntimeException {
    private final int statusCode;
    private final String rateLimitRemaining;
    private final String rateLimitReset;

    public GitHubApiException(int statusCode, String message, String rateLimitRemaining, String rateLimitReset) {
        super(message);
        this.statusCode = statusCode;
        this.rateLimitRemaining = rateLimitRemaining;
        this.rateLimitReset = rateLimitReset;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getRateLimitRemaining() {
        return rateLimitRemaining;
    }

    public String getRateLimitReset() {
        return rateLimitReset;
    }

    public boolean isRateLimit() {
        return (statusCode == 403 || statusCode == 429) && "0".equals(rateLimitRemaining);
    }

    public Instant getResetInstant() {
        if (rateLimitReset != null && !rateLimitReset.isBlank()) {
            try {
                return Instant.ofEpochSecond(Long.parseLong(rateLimitReset));
            } catch (Exception ignored) {}
        }
        return Instant.now().plusSeconds(60);
    }
}
