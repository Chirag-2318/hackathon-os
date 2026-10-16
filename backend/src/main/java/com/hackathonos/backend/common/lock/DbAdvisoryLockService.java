package com.hackathonos.backend.common.lock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Service to execute scheduled background jobs under a PostgreSQL session-level advisory lock.
 * This ensures that if two containers ever overlap during deployments, scheduled tasks do not double run.
 * Both the lock acquisition and release are bound to the exact same physical JDBC connection.
 */
@Service
public class DbAdvisoryLockService {

    private static final Logger log = LoggerFactory.getLogger(DbAdvisoryLockService.class);

    private final JdbcTemplate jdbcTemplate;

    public DbAdvisoryLockService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Attempts to acquire a PostgreSQL advisory lock for the given key and execute the task.
     *
     * @param lockKey unique 64-bit integer lock key
     * @param task    runnable to execute while holding the lock
     * @return true if lock was acquired and task was executed, false if skipped because lock was already held
     */
    public boolean tryLockAndRun(long lockKey, Runnable task) {
        try {
            return Boolean.TRUE.equals(jdbcTemplate.execute((ConnectionCallback<Boolean>) con -> {
                boolean acquired = false;
                try (PreparedStatement ps = con.prepareStatement("SELECT pg_try_advisory_lock(?)")) {
                    ps.setLong(1, lockKey);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            acquired = rs.getBoolean(1);
                        }
                    }
                }

                if (!acquired) {
                    log.debug("Advisory lock {} is held by another instance. Skipping scheduled run.", lockKey);
                    return false;
                }

                try {
                    task.run();
                    return true;
                } finally {
                    try (PreparedStatement unlockPs = con.prepareStatement("SELECT pg_advisory_unlock(?)")) {
                        unlockPs.setLong(1, lockKey);
                        unlockPs.executeQuery();
                    } catch (SQLException ex) {
                        log.warn("Failed to release PostgreSQL advisory lock {}", lockKey, ex);
                    }
                }
            }));
        } catch (DataAccessException ex) {
            log.error("Database error while evaluating advisory lock {}: {}", lockKey, ex.getMessage());
            return false;
        }
    }
}
