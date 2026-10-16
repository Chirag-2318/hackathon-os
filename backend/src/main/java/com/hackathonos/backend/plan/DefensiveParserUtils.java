package com.hackathonos.backend.plan;

import com.hackathonos.backend.plan.dto.ValidationIssueDto;
import java.util.function.Consumer;

public final class DefensiveParserUtils {

    private DefensiveParserUtils() {}

    /**
     * Trims input at a word boundary within maxLen characters and appends an ellipsis ("...").
     * The resulting string length will never exceed maxLen.
     */
    public static String trimAtWordBoundary(String input, int maxLen) {
        if (input == null || input.length() <= maxLen) {
            return input;
        }
        int target = maxLen - 3;
        if (target <= 0) {
            return input.substring(0, Math.max(0, maxLen));
        }
        int lastSpace = -1;
        for (int i = target; i >= 0; i--) {
            if (Character.isWhitespace(input.charAt(i))) {
                lastSpace = i;
                break;
            }
        }
        if (lastSpace > 0) {
            return input.substring(0, lastSpace).stripTrailing() + "...";
        }
        return input.substring(0, target) + "...";
    }

    /**
     * Defensively trims the given text if it exceeds maxLen, and emits a WARN validation issue if shortened.
     */
    public static String defensivelyTrim(
            String text,
            int maxLen,
            String fileName,
            Consumer<ValidationIssueDto> warnConsumer
    ) {
        if (text == null) {
            return null;
        }
        if (text.length() <= maxLen) {
            return text;
        }
        String trimmed = trimAtWordBoundary(text, maxLen);
        if (warnConsumer != null) {
            String snippet = text.replaceAll("[\\r\\n]+", " ").trim();
            String preview = snippet.length() > 60 ? snippet.substring(0, 57) + "..." : snippet;
            warnConsumer.accept(new ValidationIssueDto(
                    "WARN",
                    "LINE_SHORTENED",
                    fileName,
                    null,
                    "Line was shortened: " + preview,
                    "<= " + maxLen + " chars",
                    text.length() + " chars"
            ));
        }
        return trimmed;
    }
}
