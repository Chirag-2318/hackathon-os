package com.hackathonos.backend.ai;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread-safe circuit breaker for AI Gateway.
 * After 5 consecutive failures, opens and fails fast for 30 seconds.
 */
@Component
public class AiCircuitBreaker {

    private static final int FAILURE_THRESHOLD = 5;
    private static final Duration OPEN_DURATION = Duration.ofSeconds(30);

    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private volatile Instant openUntil = null;
    private volatile boolean lastCallSuccess = true;

    public synchronized boolean allowRequest() {
        if (openUntil != null) {
            if (Instant.now().isBefore(openUntil)) {
                return false;
            }
            // Cooldown passed, transition to half-open
            openUntil = null;
        }
        return true;
    }

    public synchronized void recordSuccess() {
        consecutiveFailures.set(0);
        openUntil = null;
        lastCallSuccess = true;
    }

    public synchronized void recordFailure() {
        lastCallSuccess = false;
        int failures = consecutiveFailures.incrementAndGet();
        if (failures >= FAILURE_THRESHOLD) {
            openUntil = Instant.now().plus(OPEN_DURATION);
        }
    }

    public boolean isHealthy() {
        if (openUntil != null && Instant.now().isBefore(openUntil)) {
            return false;
        }
        return consecutiveFailures.get() < FAILURE_THRESHOLD;
    }

    public boolean isCircuitOpen() {
        return openUntil != null && Instant.now().isBefore(openUntil);
    }
}
