package com.hackathonos.backend.invites;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Rate limiter for join code attempts.
 * Limits users and IPs to 10 attempts per 60 seconds (1 minute).
 */
@Component
public class JoinAttemptLimiter {

    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_SECONDS = 60; // 1 minute

    private final Cache<String, List<Instant>> attemptsByKey = Caffeine.newBuilder()
            .maximumSize(50_000)
            .expireAfterWrite(2, TimeUnit.MINUTES)
            .build();

    public void checkAndRecord(UUID userId) {
        checkAndRecord(userId != null ? "user:" + userId : "anon");
    }

    public void checkAndRecord(String key) {
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(WINDOW_SECONDS);

        attemptsByKey.asMap().compute(key, (k, attempts) -> {
            if (attempts == null) {
                attempts = new ArrayList<>();
            }
            attempts.removeIf(t -> t.isBefore(cutoff));

            if (attempts.size() >= MAX_ATTEMPTS) {
                throw new TooManyRequestsException("TOO_MANY_ATTEMPTS",
                        "Too many join attempts. Please wait 1 minute before trying again.", 60);
            }

            attempts.add(now);
            return attempts;
        });
    }

    public void clear(String key) {
        attemptsByKey.invalidate(key);
    }
}
