package com.hackathonos.backend.common.jobs;

import com.hackathonos.backend.common.lock.DbAdvisoryLockService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class CleanupJob {

    private static final Logger log = LoggerFactory.getLogger(CleanupJob.class);
    private final JdbcClient jdbcClient;
    private final DbAdvisoryLockService advisoryLockService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.common.security.OAuthLinkStateService oAuthLinkStateService;

    public CleanupJob(JdbcClient jdbcClient, DbAdvisoryLockService advisoryLockService) {
        this.jdbcClient = jdbcClient;
        this.advisoryLockService = advisoryLockService;
    }

    /**
     * Hourly pruning of room events and presence rows older than 24h, guarded by DB advisory lock.
     */
    @Scheduled(cron = "0 15 * * * *", zone = "UTC")
    public void runHourlyRealtimePrune() {
        advisoryLockService.tryLockAndRun(1005L, this::doRealtimePrune);
    }

    /**
     * Hourly pruning of idempotency keys older than 24h, guarded by DB advisory lock.
     */
    @Scheduled(cron = "0 30 * * * *", zone = "UTC")
    public void runHourlyIdempotencyPrune() {
        advisoryLockService.tryLockAndRun(1006L, this::doIdempotencyPrune);
    }

    @Transactional
    public void doIdempotencyPrune() {
        Instant cutoff24h = Instant.now().minus(24, ChronoUnit.HOURS);
        int purgedKeys = jdbcClient.sql("DELETE FROM idempotency_keys WHERE created_at < :cutoff")
                .param("cutoff", Timestamp.from(cutoff24h))
                .update();
        if (purgedKeys > 0) {
            log.info("Hourly idempotency prune: purged {} keys older than 24h", purgedKeys);
        }
    }

    @Transactional
    public void doRealtimePrune() {
        Instant cutoff24h = Instant.now().minus(24, ChronoUnit.HOURS);
        int purgedEvents = jdbcClient.sql("DELETE FROM room_events WHERE created_at < :cutoff")
                .param("cutoff", Timestamp.from(cutoff24h))
                .update();
        int purgedPresence = jdbcClient.sql("DELETE FROM room_presence WHERE last_seen < :cutoff")
                .param("cutoff", Timestamp.from(cutoff24h))
                .update();
        if (purgedEvents > 0 || purgedPresence > 0) {
            log.info("Hourly realtime prune: purged {} room_events and {} room_presence records older than 24h",
                    purgedEvents, purgedPresence);
        }
    }

    /**
     * Nightly maintenance cleanup running at 03:00 UTC, guarded by DB advisory lock.
     */
    @Scheduled(cron = "0 0 3 * * *", zone = "UTC")
    public void runCleanup() {
        advisoryLockService.tryLockAndRun(1002L, this::doCleanup);
    }

    @Transactional
    public CleanupResult doCleanup() {
        log.info("Starting nightly database cleanup job...");

        int expiredInvites = purgeExpiredInvites();
        int oldNotifications = purgeOldNotifications();
        int expiredExports = purgeExpiredDataExports();
        int oldClientErrors = purgeOldClientErrors();
        int expiredLinkStates = oAuthLinkStateService != null ? oAuthLinkStateService.cleanExpiredStates() : 0;
        doRealtimePrune();
        doIdempotencyPrune();

        log.info("Nightly cleanup complete: purged {} expired invites, {} old notifications, {} expired exports, {} client errors, {} link states",
                expiredInvites, oldNotifications, expiredExports, oldClientErrors, expiredLinkStates);

        return new CleanupResult(expiredInvites, oldNotifications, expiredExports, oldClientErrors, expiredLinkStates);
    }

    private int purgeExpiredInvites() {
        return jdbcClient.sql("DELETE FROM invites WHERE expires_at < :now")
                .param("now", Timestamp.from(Instant.now()))
                .update();
    }

    private int purgeOldNotifications() {
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        return jdbcClient.sql("DELETE FROM notifications WHERE read_at IS NOT NULL AND created_at < :cutoff")
                .param("cutoff", Timestamp.from(thirtyDaysAgo))
                .update();
    }

    private int purgeExpiredDataExports() {
        return jdbcClient.sql("DELETE FROM data_exports WHERE expires_at < :now")
                .param("now", Timestamp.from(Instant.now()))
                .update();
    }

    private int purgeOldClientErrors() {
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        return jdbcClient.sql("DELETE FROM client_errors WHERE created_at < :cutoff")
                .param("cutoff", Timestamp.from(thirtyDaysAgo))
                .update();
    }

    public record CleanupResult(int purgedInvites, int purgedNotifications, int purgedExports, int purgedClientErrors, int purgedLinkStates) {
        public CleanupResult(int purgedInvites, int purgedNotifications, int purgedExports, int purgedClientErrors) {
            this(purgedInvites, purgedNotifications, purgedExports, purgedClientErrors, 0);
        }
    }
}
