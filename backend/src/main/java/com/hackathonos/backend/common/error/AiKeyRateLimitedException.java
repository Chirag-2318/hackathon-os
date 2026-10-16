package com.hackathonos.backend.common.error;

public class AiKeyRateLimitedException extends RuntimeException {

    private final String code;
    private final int retryAfterSeconds;

    public AiKeyRateLimitedException(int retryAfterSeconds) {
        this(buildMessage(retryAfterSeconds), retryAfterSeconds);
    }

    public AiKeyRateLimitedException(String message, int retryAfterSeconds) {
        super(message);
        this.code = ErrorCode.AI_KEY_RATE_LIMITED.getCode();
        this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
    }

    public String getCode() {
        return code;
    }

    public int getRetryAfterSeconds() {
        return retryAfterSeconds;
    }

    private static String buildMessage(int seconds) {
        int minutes = Math.max(1, (int) Math.ceil(seconds / 60.0));
        return "You've reached your Groq limit. Try again in " + minutes + " minute" + (minutes > 1 ? "s" : "") + ".";
    }
}
