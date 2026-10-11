package com.hackathonos.backend.common.error;

public class BadGatewayException extends RuntimeException {
    private final String code;

    public BadGatewayException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
