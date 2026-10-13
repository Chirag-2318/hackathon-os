package com.hackathonos.backend.common.error;

public class AiOutputException extends RuntimeException {
    private final String code;

    public AiOutputException(String message) {
        this("AI_OUTPUT_ERROR", message);
    }

    public AiOutputException(String code, String message) {
        super(message);
        this.code = code;
    }

    public AiOutputException(String message, Throwable cause) {
        super(message, cause);
        this.code = "AI_OUTPUT_ERROR";
    }

    public String getCode() {
        return code;
    }
}
