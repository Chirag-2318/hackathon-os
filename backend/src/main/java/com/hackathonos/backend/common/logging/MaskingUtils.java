package com.hackathonos.backend.common.logging;

import java.util.regex.Pattern;

/**
 * Utility to mask AI API keys (Groq) and Authorization headers in logs and exception messages.
 */
public final class MaskingUtils {

    private static final Pattern GROQ_KEY_PATTERN = Pattern.compile("gsk_[A-Za-z0-9_-]{16,}");
    private static final Pattern AUTH_HEADER_PATTERN = Pattern.compile("(?i)(authorization\\s*[:=]\\s*(?:Bearer\\s+)?)[^\\s,;\"']+");
    private static final Pattern BEARER_PATTERN = Pattern.compile("(?i)(Bearer\\s+)[A-Za-z0-9_\\-.]{10,}");

    private MaskingUtils() {}

    public static String mask(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }
        String masked = GROQ_KEY_PATTERN.matcher(input).replaceAll("gsk_***REDACTED***");
        masked = AUTH_HEADER_PATTERN.matcher(masked).replaceAll("$1***REDACTED***");
        masked = BEARER_PATTERN.matcher(masked).replaceAll("$1***REDACTED***");
        return masked;
    }
}
