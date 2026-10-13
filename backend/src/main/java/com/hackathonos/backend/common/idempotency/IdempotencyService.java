package com.hackathonos.backend.common.idempotency;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory 10-minute TTL idempotency cache keyed by (userId + ":" + idempotencyKey).
 * Safely caches successful results for create-room, create-task, submit-final, and join-by-code.
 */
@Service
public class IdempotencyService {

    private static final long TTL_SECONDS = 600; // 10 minutes

    private record CachedEntry(Object response, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private final Map<String, CachedEntry> cache = new ConcurrentHashMap<>();

    public Optional<Object> get(UUID userId, String idempotencyKey) {
        if (userId == null || idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        String compositeKey = userId + ":" + idempotencyKey.trim();
        CachedEntry entry = cache.get(compositeKey);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.isExpired()) {
            cache.remove(compositeKey);
            return Optional.empty();
        }
        return Optional.ofNullable(entry.response());
    }

    public void put(UUID userId, String idempotencyKey, Object response) {
        if (userId == null || idempotencyKey == null || idempotencyKey.isBlank() || response == null) {
            return;
        }
        String compositeKey = userId + ":" + idempotencyKey.trim();
        cache.put(compositeKey, new CachedEntry(response, Instant.now().plusSeconds(TTL_SECONDS)));
        // Opportunistic cleanup if map grows
        if (cache.size() > 5000) {
            cache.entrySet().removeIf(e -> e.getValue().isExpired());
        }
    }
}
