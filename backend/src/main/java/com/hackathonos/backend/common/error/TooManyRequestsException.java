package com.hackathonos.backend.common.error;

public class TooManyRequestsException extends RuntimeException {
    private final String code;

    public TooManyRequestsException(String message) {
        this("TOO_MANY_ATTEMPTS", message);
    }

    public TooManyRequestsException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
