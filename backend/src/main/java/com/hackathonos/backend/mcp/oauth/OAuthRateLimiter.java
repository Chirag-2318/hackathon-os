package com.hackathonos.backend.mcp.oauth;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sliding window rate limiter per IP address for Dynamic Client Registration (RFC 7591).
 * Default: 20 registrations per hour per IP.
 */
@Component
public class OAuthRateLimiter {

    private static final int MAX_REQUESTS_PER_HOUR = 20;
    private static final long WINDOW_MILLIS = 3600_000L; // 1 hour

    private final Map<String, Deque<Long>> ipTimestamps = new ConcurrentHashMap<>();

    public synchronized boolean allowRequest(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            clientIp = "unknown";
        }

        long now = Instant.now().toEpochMilli();
        long windowStart = now - WINDOW_MILLIS;

        Deque<Long> timestamps = ipTimestamps.computeIfAbsent(clientIp, k -> new ArrayDeque<>());

        // Evict expired timestamps
        while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
            timestamps.pollFirst();
        }

        if (timestamps.size() >= MAX_REQUESTS_PER_HOUR) {
            return false;
        }

        timestamps.addLast(now);
        return true;
    }

    public synchronized void reset() {
        ipTimestamps.clear();
    }
}
