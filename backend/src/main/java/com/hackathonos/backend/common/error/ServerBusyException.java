package com.hackathonos.backend.common.error;

/**
 * Thrown when the system is under heavy load and external call concurrency bulkheads are saturated.
 * Maps to HTTP 503 with Retry-After header.
 */
public class ServerBusyException extends RuntimeException {

    private final String code;
    private final int retryAfterSeconds;

    public ServerBusyException(String message) {
        this("SERVER_BUSY", message, 5);
    }

    public ServerBusyException(String code, String message, int retryAfterSeconds) {
        super(message);
        this.code = code != null ? code : "SERVER_BUSY";
        this.retryAfterSeconds = retryAfterSeconds > 0 ? retryAfterSeconds : 5;
    }

    public String getCode() {
        return code;
    }

    public int getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}

