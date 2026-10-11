package com.hackathonos.backend.pitch;

import java.util.Locale;

/**
 * Resolves the recommended presentation format based on brief text keywords.
 */
public class FormatProfileResolver {

    public record FormatProfile(
            String kind,
            String label,
            int targetSeconds,
            int maxSlides,
            boolean auto
    ) {}

    /**
     * Resolves the profile from judgingFormat and deliverables text.
     */
    public static FormatProfile resolve(String judgingFormat, String deliverables) {
        String combined = ((judgingFormat != null ? judgingFormat : "") + " " +
                (deliverables != null ? deliverables : "")).toLowerCase(Locale.ROOT);

        if (combined.contains("booth") || combined.contains("live")) {
            return new FormatProfile("live_3min", "Live pitch (3 minutes)", 180, 8, true);
        }
        if (combined.contains("ppt") || combined.contains("presentation round") || combined.contains("screening")) {
            return new FormatProfile("ppt_first", "PPT first / Screening", 300, 10, true);
        }
        if (combined.contains("video") || combined.contains("async")) {
            int videoSeconds = extractVideoSeconds(combined, 120);
            return new FormatProfile("async_video", "Async video", videoSeconds, 6, true);
        }
        return new FormatProfile("demo_90s", "Demo first (90s)", 90, 5, true);
    }

    public static FormatProfile getProfileForKind(String kind) {
        if ("live_3min".equalsIgnoreCase(kind)) {
            return new FormatProfile("live_3min", "Live pitch (3 minutes)", 180, 8, false);
        }
        if ("ppt_first".equalsIgnoreCase(kind)) {
            return new FormatProfile("ppt_first", "PPT first / Screening", 300, 10, false);
        }
        if ("async_video".equalsIgnoreCase(kind)) {
            return new FormatProfile("async_video", "Async video", 120, 6, false);
        }
        return new FormatProfile("demo_90s", "Demo first (90s)", 90, 5, false);
    }

    private static int extractVideoSeconds(String text, int defaultSec) {
        if (text.contains("1 minute") || text.contains("60s") || text.contains("60 second")) return 60;
        if (text.contains("2 minute") || text.contains("120s") || text.contains("120 second")) return 120;
        if (text.contains("3 minute") || text.contains("180s") || text.contains("180 second")) return 180;
        if (text.contains("5 minute") || text.contains("300s") || text.contains("300 second")) return 300;
        return defaultSec;
    }
}
