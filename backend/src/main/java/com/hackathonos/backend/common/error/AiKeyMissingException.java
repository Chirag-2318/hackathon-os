package com.hackathonos.backend.common.error;

public class AiKeyMissingException extends RuntimeException {

    private final String code;

    public AiKeyMissingException() {
        this("You haven't added your API key yet.");
    }

    public AiKeyMissingException(String message) {
        super(message);
        this.code = ErrorCode.AI_KEY_MISSING.getCode();
    }

    public String getCode() {
        return code;
    }
}
