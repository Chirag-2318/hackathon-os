package com.hackathonos.backend.common.idempotency;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Idempotency service supporting both in-memory caching and PostgreSQL-backed 24h persistence.
 */
@Service
public class IdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyService.class);
    private static final long IN_MEMORY_TTL_SECONDS = 600; // 10 minutes

    public record StoredResponse(int status, String responseBody, String contentType) {}

    private record CachedEntry(Object response, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private final JdbcClient jdbcClient;
    private final Map<String, CachedEntry> inMemoryCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, ReentrantLock> inFlightLocks = new ConcurrentHashMap<>();

    public IdempotencyService(@Autowired(required = false) JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    /**
     * Acquire a per-user, per-key lock with 5-second wait.
     * Prevents duplicate concurrent executions.
     */
    public boolean acquireLock(UUID userId, String idempotencyKey) {
        String lockKey = (userId != null ? userId.toString() : "anon") + ":" + idempotencyKey.trim();
        ReentrantLock lock = inFlightLocks.computeIfAbsent(lockKey, k -> new ReentrantLock());
        try {
            return lock.tryLock(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    /**
     * Release the per-user, per-key lock.
     */
    public void releaseLock(UUID userId, String idempotencyKey) {
        String lockKey = (userId != null ? userId.toString() : "anon") + ":" + idempotencyKey.trim();
        ReentrantLock lock = inFlightLocks.get(lockKey);
        if (lock != null && lock.isHeldByCurrentThread()) {
            lock.unlock();
        }
    }

    /**
     * Look up a stored response from the database (valid within last 24h).
     */
    public Optional<StoredResponse> findStoredResponse(UUID userId, String idempotencyKey, String method, String path) {
        if (jdbcClient == null || idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        try {
            Instant cutoff = Instant.now().minus(24, ChronoUnit.HOURS);
            String sql = """
                    SELECT status, response_body, content_type
                    FROM idempotency_keys
                    WHERE key = :key
                      AND (
                          (user_id = :userId)
                          OR (:userId IS NULL AND user_id IS NULL)
                      )
                      AND created_at > :cutoff
                    ORDER BY created_at DESC
                    LIMIT 1
                    """;

            var spec = jdbcClient.sql(sql)
                    .param("key", idempotencyKey.trim())
                    .param("cutoff", cutoff);

            if (userId != null) {
                spec = spec.param("userId", userId);
            } else {
                spec = spec.param("userId", null, java.sql.Types.OTHER);
            }

            return spec.query((rs, rowNum) -> new StoredResponse(
                    rs.getInt("status"),
                    rs.getString("response_body"),
                    rs.getString("content_type")
            )).optional();
        } catch (Exception e) {
            log.warn("Failed to check idempotency key in DB: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Persist successful response to the database with 24h TTL.
     */
    public void saveResponse(UUID userId, String idempotencyKey, String method, String path,
                             int status, String responseBody, String contentType) {
        if (jdbcClient == null || idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }
        try {
            String sql = """
                    INSERT INTO idempotency_keys (key, user_id, method, path, status, response_body, content_type, created_at)
                    VALUES (:key, :userId, :method, :path, :status, :responseBody, :contentType, NOW())
                    ON CONFLICT (key, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid))
                    DO UPDATE SET
                        status = EXCLUDED.status,
                        response_body = EXCLUDED.response_body,
                        content_type = EXCLUDED.content_type,
                        created_at = EXCLUDED.created_at
                    """;

            var spec = jdbcClient.sql(sql)
                    .param("key", idempotencyKey.trim())
                    .param("method", method != null ? method : "POST")
                    .param("path", path != null ? path : "")
                    .param("status", status)
                    .param("responseBody", responseBody)
                    .param("contentType", contentType);

            if (userId != null) {
                spec = spec.param("userId", userId);
            } else {
                spec = spec.param("userId", null, java.sql.Types.OTHER);
            }

            spec.update();
        } catch (Exception e) {
            log.warn("Failed to save idempotency response to DB: {}", e.getMessage());
        }
    }

    // In-memory caching for backward compatibility
    public Optional<Object> get(UUID userId, String idempotencyKey) {
        if (userId == null || idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        String compositeKey = userId + ":" + idempotencyKey.trim();
        CachedEntry entry = inMemoryCache.get(compositeKey);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.isExpired()) {
            inMemoryCache.remove(compositeKey);
            return Optional.empty();
        }
        return Optional.ofNullable(entry.response());
    }

    public void put(UUID userId, String idempotencyKey, Object response) {
        if (userId == null || idempotencyKey == null || idempotencyKey.isBlank() || response == null) {
            return;
        }
        String compositeKey = userId + ":" + idempotencyKey.trim();
        inMemoryCache.put(compositeKey, new CachedEntry(response, Instant.now().plusSeconds(IN_MEMORY_TTL_SECONDS)));
        if (inMemoryCache.size() > 5000) {
            inMemoryCache.entrySet().removeIf(e -> e.getValue().isExpired());
        }
    }
}
