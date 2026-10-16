package com.hackathonos.backend.common.jobs;

import com.hackathonos.backend.common.lock.DbAdvisoryLockService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class CleanupJob {

    private static final Logger log = LoggerFactory.getLogger(CleanupJob.class);
    private final JdbcClient jdbcClient;
    private final DbAdvisoryLockService advisoryLockService;

    public CleanupJob(JdbcClient jdbcClient, DbAdvisoryLockService advisoryLockService) {
        this.jdbcClient = jdbcClient;
        this.advisoryLockService = advisoryLockService;
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

        log.info("Nightly cleanup complete: purged {} expired invites, {} old notifications, {} expired exports, {} client errors",
                expiredInvites, oldNotifications, expiredExports, oldClientErrors);

        return new CleanupResult(expiredInvites, oldNotifications, expiredExports, oldClientErrors);
    }

    private int purgeExpiredInvites() {
        return jdbcClient.sql("DELETE FROM invites WHERE expires_at < :now")
                .param("now", Instant.now())
                .update();
    }

    private int purgeOldNotifications() {
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        return jdbcClient.sql("DELETE FROM notifications WHERE read_at IS NOT NULL AND created_at < :cutoff")
                .param("cutoff", thirtyDaysAgo)
                .update();
    }

    private int purgeExpiredDataExports() {
        return jdbcClient.sql("DELETE FROM data_exports WHERE expires_at < :now")
                .param("now", Instant.now())
                .update();
    }

    private int purgeOldClientErrors() {
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        return jdbcClient.sql("DELETE FROM client_errors WHERE created_at < :cutoff")
                .param("cutoff", thirtyDaysAgo)
                .update();
    }

    public record CleanupResult(int purgedInvites, int purgedNotifications, int purgedExports, int purgedClientErrors) {}
}
