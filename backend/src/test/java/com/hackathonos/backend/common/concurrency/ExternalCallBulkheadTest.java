package com.hackathonos.backend.common.concurrency;

import com.hackathonos.backend.common.error.ApiExceptionHandler;
import com.hackathonos.backend.common.error.ErrorResponse;
import com.hackathonos.backend.common.error.ServerBusyException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ExternalCallBulkheadTest {

    @Test
    @DisplayName("Bulkhead permits are properly acquired, tracked, and released")
    void testPermitLifecycle() {
        ExternalCallBulkhead bulkhead = new ExternalCallBulkhead(2, 1, 1, 1000);

        assertThat(bulkhead.getPermitsInUse(ExternalCallBulkhead.BULKHEAD_AI_LLM)).isEqualTo(0);
        assertThat(bulkhead.getMaxPermits(ExternalCallBulkhead.BULKHEAD_AI_LLM)).isEqualTo(2);

        try (ExternalCallBulkhead.Permit permit1 = bulkhead.acquire(ExternalCallBulkhead.BULKHEAD_AI_LLM)) {
            assertThat(bulkhead.getPermitsInUse(ExternalCallBulkhead.BULKHEAD_AI_LLM)).isEqualTo(1);

            try (ExternalCallBulkhead.Permit permit2 = bulkhead.acquire(ExternalCallBulkhead.BULKHEAD_AI_LLM)) {
                assertThat(bulkhead.getPermitsInUse(ExternalCallBulkhead.BULKHEAD_AI_LLM)).isEqualTo(2);
            }

            assertThat(bulkhead.getPermitsInUse(ExternalCallBulkhead.BULKHEAD_AI_LLM)).isEqualTo(1);
        }

        assertThat(bulkhead.getPermitsInUse(ExternalCallBulkhead.BULKHEAD_AI_LLM)).isEqualTo(0);
    }

    @Test
    @DisplayName("Bulkhead throws ServerBusyException when saturated past acquire timeout")
    void testBulkheadSaturationThrowsServerBusy() throws Exception {
        // Bulkhead with capacity 1 and very short timeout (50ms)
        ExternalCallBulkhead bulkhead = new ExternalCallBulkhead(1, 1, 1, 50);

        CountDownLatch holderAcquired = new CountDownLatch(1);
        CountDownLatch releaseHolder = new CountDownLatch(1);
        AtomicBoolean holderFinished = new AtomicBoolean(false);

        Thread holderThread = new Thread(() -> {
            try (ExternalCallBulkhead.Permit permit = bulkhead.acquire(ExternalCallBulkhead.BULKHEAD_AI_LLM)) {
                holderAcquired.countDown();
                releaseHolder.await(2, TimeUnit.SECONDS);
            } catch (Exception ignored) {
            } finally {
                holderFinished.set(true);
            }
        });
        holderThread.start();

        assertThat(holderAcquired.await(1, TimeUnit.SECONDS)).isTrue();

        // While holder holds the 1 permit, another acquire should timeout and throw ServerBusyException
        ServerBusyException ex = assertThrows(ServerBusyException.class, () -> {
            bulkhead.acquire(ExternalCallBulkhead.BULKHEAD_AI_LLM);
        });

        assertThat(ex.getCode()).isEqualTo("SERVER_BUSY");
        assertThat(ex.getRetryAfterSeconds()).isEqualTo(5);
        assertThat(ex.getMessage()).contains("AI helper is busy");

        // Release holder
        releaseHolder.countDown();
        holderThread.join(1000);
        assertThat(holderFinished.get()).isTrue();
    }

    @Test
    @DisplayName("ApiExceptionHandler maps ServerBusyException to HTTP 503 with Retry-After header and SERVER_BUSY code")
    void testApiExceptionHandlerMapsServerBusy() {
        ApiExceptionHandler handler = new ApiExceptionHandler();
        ServerBusyException ex = new ServerBusyException("SERVER_BUSY", "Our AI helper is busy - trying again in a few seconds", 5);

        ResponseEntity<ErrorResponse> response = handler.handleServerBusy(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getHeaders().getFirst(HttpHeaders.RETRY_AFTER)).isEqualTo("5");
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("SERVER_BUSY");
        assertThat(response.getBody().message()).contains("Our AI helper is busy");
    }
}

