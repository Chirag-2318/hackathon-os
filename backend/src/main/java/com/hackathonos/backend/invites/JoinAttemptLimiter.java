package com.hackathonos.backend.invites;

import com.hackathonos.backend.common.error.TooManyRequestsException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class JoinAttemptLimiter {

    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_SECONDS = 600; // 10 minutes

    private final Map<UUID, List<Instant>> attemptsByUser = new ConcurrentHashMap<>();

    public void checkAndRecord(UUID userId) {
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(WINDOW_SECONDS);

        attemptsByUser.compute(userId, (k, attempts) -> {
            if (attempts == null) {
                attempts = new ArrayList<>();
            }
            // Remove attempts older than 10 minutes
            attempts.removeIf(t -> t.isBefore(cutoff));

            if (attempts.size() >= MAX_ATTEMPTS) {
                throw new TooManyRequestsException("TOO_MANY_ATTEMPTS",
                        "Too many join attempts. Please wait a few minutes before trying again.");
            }

            attempts.add(now);
            return attempts;
        });
    }

    public void clear(UUID userId) {
        attemptsByUser.remove(userId);
    }
}
