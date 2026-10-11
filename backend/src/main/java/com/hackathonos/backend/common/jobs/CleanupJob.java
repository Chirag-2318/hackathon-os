package com.hackathonos.backend.common.jobs;

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

    public CleanupJob(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    /**
     * Nightly maintenance cleanup running at 03:00 UTC.
     */
    @Scheduled(cron = "0 0 3 * * *", zone = "UTC")
    @Transactional
    public CleanupResult runCleanup() {
        log.info("Starting nightly database cleanup job...");

        int expiredInvites = purgeExpiredInvites();
        int oldNotifications = purgeOldNotifications();
        int expiredExports = purgeExpiredDataExports();

        log.info("Nightly cleanup complete: purged {} expired invites, {} old notifications, {} expired exports",
                expiredInvites, oldNotifications, expiredExports);

        return new CleanupResult(expiredInvites, oldNotifications, expiredExports);
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

    public record CleanupResult(int purgedInvites, int purgedNotifications, int purgedExports) {}
}
