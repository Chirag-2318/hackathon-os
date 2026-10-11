package com.hackathonos.backend.plan.validators;

import com.hackathonos.backend.plan.MarkdownSections;
import com.hackathonos.backend.plan.ValidationResult;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Validates demo script timing, shot list, and judge Q&A pairs using a tolerant Q&A parser.
 */
@Component
public class DemoValidator {

    public record QaPair(String question, String answer) {}

    public ValidationResult validate(String answer) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (answer == null || answer.isBlank()) {
            errors.add("Answer is empty");
            return new ValidationResult(false, errors, warnings, "Validation failed", null);
        }

        MarkdownSections sections = MarkdownSections.parse(answer);

        if (!sections.hasHeading("# Demo script")) {
            errors.add("Missing required heading: \"# Demo script\"");
        }
        if (!sections.hasHeading("# Likely judge Q&A")) {
            errors.add("Missing required heading: \"# Likely judge Q&A\"");
        }

        if (!sections.hasHeading("# Shot list")) {
            warnings.add("Missing recommended heading: \"# Shot list\"");
        }

        // Script timing check
        String scriptBody = sections.getSection("# Demo script");
        int totalSeconds = extractTotalScriptSeconds(scriptBody);
        if (totalSeconds > 0 && (totalSeconds < 60 || totalSeconds > 120)) {
            warnings.add("Demo script total timing is " + totalSeconds + "s, recommended between 60s and 120s");
        }

        // Parse Q&A pairs
        String qaBody = sections.getSection("# Likely judge Q&A");
        List<QaPair> qaPairs = parseQaPairs(qaBody);

        if (sections.hasHeading("# Likely judge Q&A") && qaPairs.size() < 3) {
            errors.add("Found " + qaPairs.size() + " Q&A pairs, minimum required is 3");
        } else if (qaPairs.size() < 8) {
            warnings.add("Found " + qaPairs.size() + " Q&A pairs, recommended at least 8");
        }

        // Check required questions
        boolean hasWeekendQuestion = false;
        boolean hasBreaksQuestion = false;
        for (QaPair pair : qaPairs) {
            String qLower = pair.question().toLowerCase();
            if (qLower.contains("what did you build this weekend") || (qLower.contains("what did you build") && qLower.contains("weekend"))) {
                hasWeekendQuestion = true;
            }
            if (qLower.contains("what breaks first")) {
                hasBreaksQuestion = true;
            }
        }

        if (!hasWeekendQuestion) {
            warnings.add("Missing required question: \"What did you build this weekend?\"");
        }
        if (!hasBreaksQuestion) {
            warnings.add("Missing required question: \"What breaks first?\"");
        }

        boolean valid = errors.isEmpty();
        String summary = valid
                ? "Demo script (" + (totalSeconds > 0 ? totalSeconds + "s" : "~90s") + ") and " + qaPairs.size() + " judge Q&A pairs validated"
                : "Validation failed with " + errors.size() + " errors";

        return new ValidationResult(valid, errors, warnings, summary, sections.getSections());
    }

    /**
     * Tolerantly parses question and answer pairs from Markdown text.
     * Matches questions starting with Q, Q1, "Q:", or bold variants after list markers or numbers.
     */
    public List<QaPair> parseQaPairs(String text) {
        if (text == null || text.isBlank()) {
            return Collections.emptyList();
        }

        List<QaPair> pairs = new ArrayList<>();
        // Matches e.g.: "1. Q: ...", "Q1: ...", "**Q:** ...", "- Q: ...", "Q. ..."
        Pattern qPattern = Pattern.compile("^(?:[-*]\\s+|\\d+[.)]\\s+)?(?i:\\*\\*Q(?:\\d+)?[:.]?\\*\\*|Q(?:\\d+)?[:.]?)\\s*(.*)$");

        String[] lines = text.split("\\r?\\n");
        String currentQuestion = null;
        StringBuilder currentAnswer = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();
            Matcher matcher = qPattern.matcher(trimmed);

            if (matcher.matches()) {
                if (currentQuestion != null) {
                    pairs.add(new QaPair(currentQuestion, currentAnswer.toString().trim()));
                }
                currentQuestion = matcher.group(1).trim();
                currentAnswer = new StringBuilder();
            } else {
                if (currentQuestion != null) {
                    // Strip "A:" prefix if present
                    String ansLine = trimmed;
                    if (ansLine.matches("^(?:[-*]\\s+|\\d+[.)]\\s+)?(?i:\\*\\*A(?:\\d+)?[:.]?\\*\\*|A(?:\\d+)?[:.]?)\\s*(.*)$")) {
                        ansLine = ansLine.replaceFirst("^(?:[-*]\\s+|\\d+[.)]\\s+)?(?i:\\*\\*A(?:\\d+)?[:.]?\\*\\*|A(?:\\d+)?[:.]?)\\s*", "");
                    }
                    currentAnswer.append(ansLine).append("\n");
                }
            }
        }

        if (currentQuestion != null) {
            pairs.add(new QaPair(currentQuestion, currentAnswer.toString().trim()));
        }

        return pairs;
    }

    private int extractTotalScriptSeconds(String text) {
        if (text == null) return 0;
        // Match numbers followed by s or sec (e.g. "20s", "40 sec", "[0-20s]", "30 seconds")
        Pattern p = Pattern.compile("(\\d+)\\s*(?:s|sec|seconds)\\b", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(text);
        int total = 0;
        while (m.find()) {
            try {
                total += Integer.parseInt(m.group(1));
            } catch (Exception ignored) {}
        }
        return total;
    }
}
