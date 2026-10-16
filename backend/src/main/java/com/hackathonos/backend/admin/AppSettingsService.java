package com.hackathonos.backend.admin;

import com.hackathonos.backend.admin.dto.AdminOverviewDto;
import com.hackathonos.backend.admin.dto.CapacityDto;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.ErrorCode;
import com.hackathonos.backend.common.error.LimitReachedException;
import com.hackathonos.backend.common.error.SignupClosedException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class AppSettingsService {

    private static final long SIGNUP_CAP_LOCK_KEY = 89421001L;

    private final JdbcTemplate jdbcTemplate;
    private final AppProperties appProperties;

    private volatile CapacityDto cachedCapacity;
    private volatile long cacheExpiresAt = 0L;

    public AppSettingsService(JdbcTemplate jdbcTemplate, AppProperties appProperties) {
        this.jdbcTemplate = jdbcTemplate;
        this.appProperties = appProperties;
    }

    public boolean isAdmin(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String adminEmailsConfig = appProperties.getAdminEmails();
        if (adminEmailsConfig == null || adminEmailsConfig.isBlank()) {
            return false;
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        String[] parts = adminEmailsConfig.split(",");
        for (String part : parts) {
            if (part.trim().toLowerCase(Locale.ROOT).equals(normalized)) {
                return true;
            }
        }
        return false;
    }

    public boolean isSignupsOpen() {
        try {
            List<String> values = jdbcTemplate.query(
                    "SELECT value FROM app_settings WHERE key = 'signups_open'",
                    (rs, rowNum) -> rs.getString("value")
            );
            if (values.isEmpty()) {
                return true;
            }
            return !"false".equalsIgnoreCase(values.get(0).trim());
        } catch (Exception e) {
            return true;
        }
    }

    @Transactional
    public void setSignupsOpen(boolean open) {
        jdbcTemplate.update(
                "INSERT INTO app_settings (key, value, updated_at) VALUES ('signups_open', ?, now()) " +
                        "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()",
                String.valueOf(open)
        );
        invalidateCapacityCache();
    }

    public synchronized void invalidateCapacityCache() {
        cachedCapacity = null;
        cacheExpiresAt = 0L;
    }

    @Transactional
    public void checkCanSignUp(String email) {
        // 1. Take advisory lock for the duration of this transaction
        jdbcTemplate.execute("SELECT pg_advisory_xact_lock(" + SIGNUP_CAP_LOCK_KEY + ")");

        // 2. Admin emails are exempt from the cap and closed signups
        if (isAdmin(email)) {
            return;
        }

        // 3. Check DB-backed signups switch
        if (!isSignupsOpen()) {
            throw new SignupClosedException("closed", "Sign-ups are paused for now.");
        }

        // 4. Check capacity
        int cap = appProperties.getUserCap();
        if (cap > 0) {
            Long activeUsers = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL",
                    Long.class
            );
            if (activeUsers != null && activeUsers >= cap) {
                throw new SignupClosedException("capacity", "We're at capacity.");
            }
        }
    }

    public CapacityDto getCapacity() {
        long now = System.currentTimeMillis();
        CapacityDto current = cachedCapacity;
        if (current != null && now < cacheExpiresAt) {
            return current;
        }

        synchronized (this) {
            if (cachedCapacity != null && System.currentTimeMillis() < cacheExpiresAt) {
                return cachedCapacity;
            }

            int cap = appProperties.getUserCap();
            boolean openDb = isSignupsOpen();
            Long count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL",
                    Long.class
            );
            long activeUsers = count != null ? count : 0L;

            boolean open;
            Integer spotsLeft;

            if (cap <= 0) {
                open = openDb;
                spotsLeft = null;
            } else {
                int spots = (int) Math.max(0, cap - activeUsers);
                spotsLeft = spots;
                open = openDb && spots > 0;
            }

            CapacityDto fresh = new CapacityDto(open, cap, spotsLeft);
            cachedCapacity = fresh;
            cacheExpiresAt = System.currentTimeMillis() + 30_000L;
            return fresh;
        }
    }

    @Transactional
    public void checkUploadQuota(UUID userId, long additionalBytes) {
        if (userId == null) return;
        int maxMb = appProperties.getMaxUploadMbPerUser();
        long maxBytes = (long) maxMb * 1024L * 1024L;

        Long current = jdbcTemplate.query(
                "SELECT total_bytes FROM user_upload_usage WHERE user_id = ?",
                rs -> rs.next() ? rs.getLong("total_bytes") : 0L,
                userId
        );
        long currentBytes = current != null ? current : 0L;

        if (currentBytes + additionalBytes > maxBytes) {
            throw new LimitReachedException(ErrorCode.LIMIT_REACHED,
                    "You've reached your total upload limit of " + maxMb + " MB.");
        }

        jdbcTemplate.update(
                "INSERT INTO user_upload_usage (user_id, total_bytes, updated_at) VALUES (?, ?, now()) " +
                        "ON CONFLICT (user_id) DO UPDATE SET total_bytes = user_upload_usage.total_bytes + EXCLUDED.total_bytes, updated_at = now()",
                userId, additionalBytes
        );
    }

    public AdminOverviewDto getAdminOverview() {
        CapacityDto capacity = getCapacity();
        int cap = capacity.cap();
        Integer spotsLeft = capacity.spotsLeft();
        boolean signupsOpen = isSignupsOpen();

        long users = queryCount("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL");
        long signups24h = queryCount("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours'");
        long waitlistCount = queryCount("SELECT COUNT(*) FROM waitlist_signups");
        long rooms = queryCount("SELECT COUNT(*) FROM rooms WHERE deleted_at IS NULL");
        long roomsActive24h = queryCount("SELECT COUNT(DISTINCT room_id) FROM activity_events WHERE created_at >= NOW() - INTERVAL '24 hours'");
        long members = queryCount("SELECT COUNT(*) FROM room_members");

        long emailsSentToday = queryCount("SELECT COUNT(*) FROM email_outbox WHERE status = 'SENT' AND sent_at >= CURRENT_DATE");
        long emailsFailed24h = queryCount("SELECT COUNT(*) FROM email_outbox WHERE status = 'FAILED' AND created_at >= NOW() - INTERVAL '24 hours'");
        long outboxPending = queryCount("SELECT COUNT(*) FROM email_outbox WHERE status = 'PENDING'");

        long usersWithAiKey = queryCount("SELECT COUNT(*) FROM user_ai_keys WHERE status = 'VALID'");
        long aiCallsToday = queryCount("SELECT COALESCE(SUM(calls), 0) FROM ai_usage_daily WHERE day = CURRENT_DATE");
        long aiFailures24h = queryCount("SELECT COALESCE(SUM(failures), 0) FROM ai_usage_daily WHERE day >= CURRENT_DATE - 1");

        long clientErrors24h = 0L;
        try {
            Long errs = jdbcTemplate.queryForObject(
                    "SELECT CASE WHEN to_regclass('client_errors') IS NOT NULL " +
                            "THEN (SELECT COUNT(*) FROM client_errors WHERE created_at >= NOW() - INTERVAL '24 hours') " +
                            "ELSE 0 END",
                    Long.class
            );
            clientErrors24h = errs != null ? errs : 0L;
        } catch (Exception ignored) {}

        String databaseSize = "Unknown";
        try {
            databaseSize = jdbcTemplate.queryForObject("SELECT pg_size_pretty(pg_database_size(current_database()))", String.class);
        } catch (Exception ignored) {}

        return new AdminOverviewDto(
                users,
                cap,
                spotsLeft,
                signups24h,
                waitlistCount,
                rooms,
                roomsActive24h,
                members,
                emailsSentToday,
                emailsFailed24h,
                outboxPending,
                usersWithAiKey,
                aiCallsToday,
                aiFailures24h,
                clientErrors24h,
                databaseSize != null ? databaseSize : "0 MB",
                signupsOpen
        );
    }

    public String getWaitlistCsv() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT email, created_at FROM waitlist_signups ORDER BY created_at DESC"
        );
        StringBuilder sb = new StringBuilder("email,created_at\n");
        for (Map<String, Object> row : rows) {
            String email = String.valueOf(row.get("email"));
            String createdAt = String.valueOf(row.get("created_at"));
            sb.append(email).append(',').append(createdAt).append('\n');
        }
        return sb.toString();
    }

    private long queryCount(String sql) {
        try {
            Long val = jdbcTemplate.queryForObject(sql, Long.class);
            return val != null ? val : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }
}
