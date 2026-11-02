package com.hackathonos.backend.common.concurrency;

import com.hackathonos.backend.common.error.ServerBusyException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * Bulkhead concurrency limiter for protecting server resources during slow external calls
 * (LLMs, STT, and heavy PDF/PPTX parsing).
 */
@Component
public class ExternalCallBulkhead {

    private static final Logger log = LoggerFactory.getLogger(ExternalCallBulkhead.class);

    public static final String BULKHEAD_AI_LLM = "ai-llm";
    public static final String BULKHEAD_AI_STT = "ai-stt";
    public static final String BULKHEAD_HEAVY_PARSE = "heavy-parse";

    private final Map<String, Semaphore> semaphores = new ConcurrentHashMap<>();
    private final Map<String, Integer> maxPermits = new ConcurrentHashMap<>();
    private final long timeoutMs;

    public ExternalCallBulkhead(
            @Value("${AI_MAX_CONCURRENT:6}") int aiMaxConcurrent,
            @Value("${STT_MAX_CONCURRENT:3}") int sttMaxConcurrent,
            @Value("${HEAVY_PARSE_MAX_CONCURRENT:2}") int heavyParseMaxConcurrent,
            @Value("${BULKHEAD_ACQUIRE_TIMEOUT_MS:5000}") long timeoutMs
    ) {
        this.timeoutMs = timeoutMs > 0 ? timeoutMs : 5000;

        register(BULKHEAD_AI_LLM, Math.max(1, aiMaxConcurrent));
        register(BULKHEAD_AI_STT, Math.max(1, sttMaxConcurrent));
        register(BULKHEAD_HEAVY_PARSE, Math.max(1, heavyParseMaxConcurrent));
    }

    private void register(String name, int permits) {
        maxPermits.put(name, permits);
        semaphores.put(name, new Semaphore(permits, true));
    }

    /**
     * Acquires a permit for the specified named bulkhead, waiting up to the configured timeout.
     * Returns an AutoCloseable permit that releases on close.
     *
     * @param name bulkhead name ("ai-llm", "ai-stt", "heavy-parse")
     * @return AutoCloseable permit
     * @throws ServerBusyException if acquiring the permit times out
     */
    public Permit acquire(String name) {
        Semaphore sem = semaphores.get(name);
        if (sem == null) {
            log.warn("Unknown bulkhead named '{}', falling back to unbound execution", name);
            return () -> {};
        }

        boolean acquired;
        try {
            acquired = sem.tryAcquire(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ServerBusyException("SERVER_BUSY", "Operation interrupted while waiting for resource capacity", 5);
        }

        if (!acquired) {
            log.warn("Bulkhead '{}' saturated ({} in use, 0 available). Rejecting request with SERVER_BUSY.",
                    name, maxPermits.get(name));
            throw new ServerBusyException(
                    "SERVER_BUSY",
                    "Our AI helper is busy - please try again in a few seconds.",
                    5
            );
        }

        return () -> sem.release();
    }

    /**
     * Executes the given supplier within the named bulkhead.
     */
    public <T> T execute(String name, SupplierWithException<T> action) throws Exception {
        try (Permit permit = acquire(name)) {
            return action.get();
        }
    }

    /**
     * Executes the given runnable within the named bulkhead.
     */
    public void execute(String name, RunnableWithException action) throws Exception {
        try (Permit permit = acquire(name)) {
            action.run();
        }
    }

    public int getPermitsInUse(String name) {
        Semaphore sem = semaphores.get(name);
        Integer max = maxPermits.get(name);
        if (sem == null || max == null) return 0;
        return Math.max(0, max - sem.availablePermits());
    }

    public int getMaxPermits(String name) {
        return maxPermits.getOrDefault(name, 0);
    }

    @FunctionalInterface
    public interface Permit extends AutoCloseable {
        @Override
        void close();
    }

    @FunctionalInterface
    public interface SupplierWithException<T> {
        T get() throws Exception;
    }

    @FunctionalInterface
    public interface RunnableWithException {
        void run() throws Exception;
    }
}

