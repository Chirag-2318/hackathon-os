package com.hackathonos.backend.github.client;

import com.hackathonos.backend.common.error.TooManyRequestsException;

import java.time.Instant;

public class GitHubRateLimitException extends TooManyRequestsException {
    private final Instant resetAt;

    public GitHubRateLimitException(Instant resetAt) {
        super("GITHUB_RATE_LIMIT", "GitHub API rate limit exceeded. Resets at " + (resetAt != null ? resetAt : "later"));
        this.resetAt = resetAt;
    }

    public Instant getResetAt() {
        return resetAt;
    }
}
