package com.hackathonos.backend.common.security;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimiter {

    private final Clock clock;
    private final com.github.benmanes.caffeine.cache.Cache<String, TokenBucket> buckets = com.github.benmanes.caffeine.cache.Caffeine.newBuilder()
            .maximumSize(50_000)
            .expireAfterAccess(1, java.util.concurrent.TimeUnit.HOURS)
            .build();

    public RateLimiter(Clock clock) {
        this.clock = clock;
    }

    public record RateLimitResult(boolean allowed, long retryAfterSeconds) {}

    public static class TokenBucket {
        private final double capacity;
        private final double tokensPerSecond;
        private double tokens;
        private Instant lastRefill;

        public TokenBucket(double capacity, double refillPerPeriod, Duration period, Instant now) {
            this.capacity = capacity;
            this.tokensPerSecond = refillPerPeriod / period.toSeconds();
            this.tokens = capacity;
            this.lastRefill = now;
        }

        public synchronized RateLimitResult tryConsume(double tokensToConsume, Instant now) {
            double elapsedSeconds = (double) Duration.between(lastRefill, now).toMillis() / 1000.0;
            if (elapsedSeconds > 0) {
                tokens = Math.min(capacity, tokens + (elapsedSeconds * tokensPerSecond));
                lastRefill = now;
            }

            if (tokens >= tokensToConsume) {
                tokens -= tokensToConsume;
                return new RateLimitResult(true, 0);
            }

            double missing = tokensToConsume - tokens;
            long retryAfter = Math.max(1, (long) Math.ceil(missing / tokensPerSecond));
            return new RateLimitResult(false, retryAfter);
        }

        public synchronized boolean isStale(Instant now, Duration ttl) {
            return Duration.between(lastRefill, now).compareTo(ttl) > 0;
        }
    }

    /**
     * Checks rate limit for a given key, capacity, and refill period.
     */
    public RateLimitResult tryAcquire(String key, int capacity, int refillCount, Duration period) {
        Instant now = clock.instant();
        TokenBucket bucket = buckets.get(key, k -> new TokenBucket(capacity, refillCount, period, now));
        return bucket.tryConsume(1.0, now);
    }

    /**
     * Periodic eviction of idle rate limiter buckets.
     */
    @Scheduled(fixedDelay = 300000)
    public void cleanupStaleBuckets() {
        buckets.cleanUp();
    }
}
