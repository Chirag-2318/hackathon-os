package com.hackathonos.backend.ai;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * In-memory rate limiter permitting 30 AI calls per user per hour.
 * Backed by a bounded Caffeine cache.
 */
@Component
public class AiRateLimiter {

    private static final int MAX_CALLS_PER_HOUR = 30;
    private static final Duration WINDOW = Duration.ofHours(1);

    private final Cache<UUID, Deque<Instant>> userCallHistory = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterAccess(1, TimeUnit.HOURS)
            .build();

    /**
     * Checks and records an AI call for the given user, or throws 429 AI_RATE_LIMIT.
     */
    public synchronized void checkAndRecord(UUID userId) {
        Instant now = Instant.now();
        Instant cutoff = now.minus(WINDOW);

        Deque<Instant> history = userCallHistory.get(userId, k -> new ArrayDeque<>());

        // Evict timestamps older than 1 hour
        while (!history.isEmpty() && history.peekFirst().isBefore(cutoff)) {
            history.pollFirst();
        }

        if (history.size() >= MAX_CALLS_PER_HOUR) {
            throw new TooManyRequestsException("AI_RATE_LIMIT", "AI rate limit exceeded (maximum 30 calls per hour)");
        }

        history.addLast(now);
    }
}
