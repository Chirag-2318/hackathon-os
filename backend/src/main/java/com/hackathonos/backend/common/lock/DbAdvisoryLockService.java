package com.hackathonos.backend.common.lock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.function.Supplier;

/**
 * Service to execute scheduled background jobs under PostgreSQL advisory locks.
 * Supports both session-level locks (for brief maintenance tasks) and transaction-scoped
 * locks (pg_try_advisory_xact_lock) for claiming work batches without holding pooled
 * JDBC connections during subsequent slow external I/O.
 */
@Service
public class DbAdvisoryLockService {

    private static final Logger log = LoggerFactory.getLogger(DbAdvisoryLockService.class);

    private final JdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;

    public DbAdvisoryLockService(JdbcTemplate jdbcTemplate, TransactionTemplate transactionTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
    }

    /**
     * Attempts to acquire a PostgreSQL session advisory lock for the given key and execute the task.
     * Note: Holds the physical pooled connection for the entire duration of task.run().
     * For jobs with outbound HTTP/SMTP, prefer {@link #tryXactLockAndClaim(long, Supplier)}.
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
                } catch (Throwable t) {
                    log.error("Execution error in advisory lock {}: class={}, message={}",
                            lockKey, t.getClass().getName(), t.getMessage(), t);
                    throw t;
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
            log.error("Database error while evaluating advisory lock {}: class={}, message={}",
                    lockKey, ex.getClass().getName(), ex.getMessage(), ex);
            return false;
        } catch (Throwable ex) {
            log.error("Unexpected error in advisory lock {}: class={}, message={}",
                    lockKey, ex.getClass().getName(), ex.getMessage(), ex);
            return false;
        }
    }

    /**
     * Claims work inside a short transaction protected by PostgreSQL transaction-scoped advisory lock
     * (pg_try_advisory_xact_lock). The lock automatically releases when the transaction commits,
     * immediately returning the DB connection to HikariCP pool before slow external I/O begins.
     *
     * @param lockKey       unique 64-bit integer lock key
     * @param claimFunction supplier that reads and marks claimed work inside the short transaction
     * @param <T>           type of claimed work
     * @return Optional containing claimed work, or empty if lock was not acquired or claiming failed
     */
    public <T> Optional<T> tryXactLockAndClaim(long lockKey, Supplier<T> claimFunction) {
        try {
            return Optional.ofNullable(transactionTemplate.execute(status -> {
                boolean acquired = false;
                try {
                    Boolean res = jdbcTemplate.queryForObject("SELECT pg_try_advisory_xact_lock(?)", Boolean.class, lockKey);
                    acquired = Boolean.TRUE.equals(res);
                } catch (Exception ex) {
                    log.warn("Could not query pg_try_advisory_xact_lock for key {}: {}. Proceeding without lock.", lockKey, ex.getMessage());
                    acquired = true;
                }

                if (!acquired) {
                    log.debug("Transaction advisory lock {} is held by another instance. Skipping.", lockKey);
                    return null;
                }

                return claimFunction.get();
            }));
        } catch (Exception ex) {
            log.error("Error executing transaction advisory lock claim for key {}: class={}, message={}",
                    lockKey, ex.getClass().getName(), ex.getMessage(), ex);
            return Optional.empty();
        }
    }
}
