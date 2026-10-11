package com.hackathonos.backend.common.error;

public class UnprocessableEntityException extends RuntimeException {
    private final String code;

    public UnprocessableEntityException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
