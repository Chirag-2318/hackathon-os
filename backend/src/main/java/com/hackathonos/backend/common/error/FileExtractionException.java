package com.hackathonos.backend.common.error;

import org.springframework.http.HttpStatus;

public class FileExtractionException extends RuntimeException {
    private final String code;
    private final HttpStatus status;

    public FileExtractionException(String code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public FileExtractionException(String code, String message) {
        this(code, message, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
