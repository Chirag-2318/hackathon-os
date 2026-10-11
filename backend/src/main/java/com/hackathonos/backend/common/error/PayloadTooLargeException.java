package com.hackathonos.backend.common.error;

public class PayloadTooLargeException extends RuntimeException {
    private final String code;

    public PayloadTooLargeException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
