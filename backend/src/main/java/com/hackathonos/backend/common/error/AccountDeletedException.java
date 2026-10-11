package com.hackathonos.backend.common.error;

/**
 * Thrown when an authenticated user's account has been marked deleted.
 */
public class AccountDeletedException extends RuntimeException {
    private final String code;

    public AccountDeletedException(String message) {
        this("ACCOUNT_DELETED", message);
    }

    public AccountDeletedException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
