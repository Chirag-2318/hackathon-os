package com.hackathonos.backend.common.logging;

import com.hackathonos.backend.common.concurrency.ExternalCallBulkhead;
import com.hackathonos.backend.events.RoomEventHub;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * Scheduled poor-man's dashboard logger printing system health and resource consumption
 * every 60 seconds as a single clean INFO line in production Render logs.
 */
@Component
@ConditionalOnProperty(name = "app.metrics.logger.enabled", havingValue = "true", matchIfMissing = true)
public class SystemMetricsLogger {

    private static final Logger log = LoggerFactory.getLogger(SystemMetricsLogger.class);

    private final DataSource dataSource;
    private final ExternalCallBulkhead bulkhead;
    private final RoomEventHub roomEventHub;

    public SystemMetricsLogger(DataSource dataSource, ExternalCallBulkhead bulkhead, RoomEventHub roomEventHub) {
        this.dataSource = dataSource;
        this.bulkhead = bulkhead;
        this.roomEventHub = roomEventHub;
    }

    @Scheduled(fixedRate = 60000)
    public void logMetrics() {
        int active = 0, idle = 0, waiting = 0;
        try {
            if (dataSource instanceof HikariDataSource hikari) {
                HikariPoolMXBean poolBean = hikari.getHikariPoolMXBean();
                if (poolBean != null) {
                    active = poolBean.getActiveConnections();
                    idle = poolBean.getIdleConnections();
                    waiting = poolBean.getThreadsAwaitingConnection();
                }
            } else if (dataSource.isWrapperFor(HikariDataSource.class)) {
                HikariDataSource hikari = dataSource.unwrap(HikariDataSource.class);
                HikariPoolMXBean poolBean = hikari.getHikariPoolMXBean();
                if (poolBean != null) {
                    active = poolBean.getActiveConnections();
                    idle = poolBean.getIdleConnections();
                    waiting = poolBean.getThreadsAwaitingConnection();
                }
            }
        } catch (Exception ignored) {}

        int llmInUse = bulkhead.getPermitsInUse(ExternalCallBulkhead.BULKHEAD_AI_LLM);
        int llmMax = bulkhead.getMaxPermits(ExternalCallBulkhead.BULKHEAD_AI_LLM);
        int sttInUse = bulkhead.getPermitsInUse(ExternalCallBulkhead.BULKHEAD_AI_STT);
        int sttMax = bulkhead.getMaxPermits(ExternalCallBulkhead.BULKHEAD_AI_STT);
        int parseInUse = bulkhead.getPermitsInUse(ExternalCallBulkhead.BULKHEAD_HEAVY_PARSE);
        int parseMax = bulkhead.getMaxPermits(ExternalCallBulkhead.BULKHEAD_HEAVY_PARSE);

        int sseCount = roomEventHub != null ? roomEventHub.getActiveConnectionCount() : 0;

        Runtime rt = Runtime.getRuntime();
        long usedMb = (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024);
        long maxMb = rt.maxMemory() / (1024 * 1024);

        log.info("[METRICS] Hikari(active={}, idle={}, waiting={}) | Bulkhead(llm={}/{}, stt={}/{}, parse={}/{}) | SSE(active={}) | JVM Heap(used={}MB, max={}MB)",
                active, idle, waiting,
                llmInUse, llmMax, sttInUse, sttMax, parseInUse, parseMax,
                sseCount,
                usedMb, maxMb);
    }
}

