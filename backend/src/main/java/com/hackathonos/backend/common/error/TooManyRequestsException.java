package com.hackathonos.backend.common.error;

public class TooManyRequestsException extends RuntimeException {
    private final String code;
    private final long retryAfterSeconds;

    public TooManyRequestsException(String message) {
        this("TOO_MANY_ATTEMPTS", message, 60);
    }

    public TooManyRequestsException(String code, String message) {
        this(code, message, 60);
    }

    public TooManyRequestsException(String code, String message, long retryAfterSeconds) {
        super(message);
        this.code = code;
        this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
    }

    public String getCode() {
        return code;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
