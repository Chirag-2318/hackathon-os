package com.hackathonos.backend.common.error;

/**
 * Thrown when an unauthenticated request attempts to access an authenticated resource.
 */
public class UnauthenticatedException extends RuntimeException {
    private final String code;

    public UnauthenticatedException(String message) {
        this("UNAUTHENTICATED", message);
    }

    public UnauthenticatedException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
