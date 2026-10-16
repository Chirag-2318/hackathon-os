package com.hackathonos.backend.common.error;

public class AiKeyInvalidException extends RuntimeException {

    private final String code;

    public AiKeyInvalidException() {
        this("Groq rejected your API key. Check it in Settings.");
    }

    public AiKeyInvalidException(String message) {
        super(message);
        this.code = ErrorCode.AI_KEY_INVALID.getCode();
    }

    public String getCode() {
        return code;
    }
}
