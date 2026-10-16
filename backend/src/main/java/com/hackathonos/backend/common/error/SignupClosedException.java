package com.hackathonos.backend.common.error;

public class SignupClosedException extends RuntimeException {
    private final String reason;

    public SignupClosedException(String reason, String message) {
        super(message);
        this.reason = reason != null ? reason : "capacity";
    }

    public String getReason() {
        return reason;
    }
}
