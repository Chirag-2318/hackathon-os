package com.hackathonos.backend.pitch;

import java.util.*;

/**
 * Pure calculator checking pitch slides for length, coverage, and required story beats.
 */
public class SlideLinter {

    public record LintIssue(
            UUID slideId,
            String severity, // "warning" | "info"
            String code,     // TOO_MUCH_TEXT, NO_PROBLEM_SLIDE, etc.
            String message,
            String type      // frontend compatibility: too_much_text, no_problem_slide, no_impact_number, etc.
    ) {}

    public static List<LintIssue> lint(
            List<PitchSlide> slides,
            int maxSlides,
            List<String> rubricCriteria,
            Map<UUID, List<String>> slideCoverage
    ) {
        List<LintIssue> issues = new ArrayList<>();

        boolean hasProblem = false;
        boolean hasWhatsNext = false;
        boolean hasImpact = false;

        for (PitchSlide slide : slides) {
            String content = slide.getContent() != null ? slide.getContent().trim() : "";
            int wordCount = countWords(content);

            if (content.isBlank()) {
                issues.add(new LintIssue(
                        slide.getId(),
                        "warning",
                        "EMPTY_SLIDE",
                        "Slide '" + slide.getTitle() + "' is empty",
                        "empty_slide"
                ));
            } else if (wordCount > 70) {
                issues.add(new LintIssue(
                        slide.getId(),
                        "warning",
                        "TOO_MUCH_TEXT",
                        "Slide '" + slide.getTitle() + "' has " + wordCount + " words (keep under 70)",
                        "too_much_text"
                ));
            }

            String kind = slide.getKind() != null ? slide.getKind().toUpperCase(Locale.ROOT) : "";
            if ("PROBLEM".equals(kind)) {
                hasProblem = true;
            } else if ("NEXT".equals(kind)) {
                hasWhatsNext = true;
            } else if ("IMPACT".equals(kind)) {
                hasImpact = true;
                if (!content.matches(".*\\d+.*")) {
                    issues.add(new LintIssue(
                            slide.getId(),
                            "warning",
                            "NO_IMPACT_NUMBER",
                            "Impact slide contains no concrete numbers or metrics",
                            "no_impact_number"
                    ));
                }
            }
        }

        if (!hasProblem) {
            issues.add(new LintIssue(
                    null,
                    "warning",
                    "NO_PROBLEM_SLIDE",
                    "Deck is missing a dedicated Problem slide",
                    "no_problem_slide"
            ));
        }

        if (!hasWhatsNext) {
            issues.add(new LintIssue(
                    null,
                    "info",
                    "NO_WHATS_NEXT",
                    "Deck is missing a 'What's next' / roadmap slide",
                    "no_roadmap"
            ));
        }

        if (slides.size() > maxSlides) {
            issues.add(new LintIssue(
                    null,
                    "warning",
                    "TOO_MANY_SLIDES",
                    "Deck has " + slides.size() + " slides (maximum recommended is " + maxSlides + ")",
                    "too_many_slides"
            ));
        }

        // Coverage gaps
        Set<String> coveredCriteria = new HashSet<>();
        for (List<String> crits : slideCoverage.values()) {
            if (crits != null) {
                coveredCriteria.addAll(crits);
            }
        }

        for (String criterion : rubricCriteria) {
            if (!coveredCriteria.contains(criterion)) {
                issues.add(new LintIssue(
                        null,
                        "info",
                        "COVERAGE_GAP",
                        "No slide covers the judging criterion: " + criterion,
                        "coverage_gap"
                ));
            }
        }

        return issues;
    }

    public static int countWords(String s) {
        if (s == null || s.isBlank()) return 0;
        return s.trim().split("\\s+").length;
    }
}
