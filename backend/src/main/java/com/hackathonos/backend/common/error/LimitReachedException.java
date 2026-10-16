package com.hackathonos.backend.common.error;

public class LimitReachedException extends RuntimeException {
    private final String code;

    public LimitReachedException(ErrorCode errorCode, String message) {
        super(message);
        this.code = errorCode != null ? errorCode.getCode() : "LIMIT_REACHED";
    }

    public LimitReachedException(String code, String message) {
        super(message);
        this.code = code != null ? code : "LIMIT_REACHED";
    }

    public String getCode() {
        return code;
    }
}
