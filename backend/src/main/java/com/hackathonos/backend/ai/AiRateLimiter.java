package com.hackathonos.backend.ai;

import com.hackathonos.backend.common.error.TooManyRequestsException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory rate limiter permitting 10 AI calls per user per hour.
 */
@Component
public class AiRateLimiter {

    private static final int MAX_CALLS_PER_HOUR = 30;
    private static final Duration WINDOW = Duration.ofHours(1);

    private final Map<UUID, Deque<Instant>> userCallHistory = new ConcurrentHashMap<>();

    /**
     * Checks and records an AI call for the given user, or throws 429 AI_RATE_LIMIT.
     */
    public synchronized void checkAndRecord(UUID userId) {
        Instant now = Instant.now();
        Instant cutoff = now.minus(WINDOW);

        Deque<Instant> history = userCallHistory.computeIfAbsent(userId, k -> new ArrayDeque<>());

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
