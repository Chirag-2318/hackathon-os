package com.hackathonos.backend.plan.validators;

import com.hackathonos.backend.plan.MarkdownSections;
import com.hackathonos.backend.plan.ValidationResult;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Validates Tech stack and architecture step, checking table rows, mermaid diagrams, and risks.
 */
@Component
public class TechValidator {

    public ValidationResult validate(String answer) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (answer == null || answer.isBlank()) {
            errors.add("Answer is empty");
            return new ValidationResult(false, errors, warnings, "Validation failed", null);
        }

        MarkdownSections sections = MarkdownSections.parse(answer);

        if (!sections.hasHeading("# Tech stack")) {
            errors.add("Missing required heading: \"# Tech stack\"");
        }
        if (!sections.hasHeading("# Architecture")) {
            errors.add("Missing required heading: \"# Architecture\"");
        }

        if (!sections.hasHeading("# New-tech risks")) {
            warnings.add("Missing recommended heading: \"# New-tech risks\"");
        }

        // Table check under # Tech stack
        String techBody = sections.getSection("# Tech stack");
        if (sections.hasHeading("# Tech stack")) {
            String[] lines = techBody.split("\\r?\\n");
            int dataRowCount = 0;
            boolean missingKnownOrNew = false;
            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.startsWith("|") && !trimmed.contains("---")) {
                    String[] cells = trimmed.split("\\|");
                    // skip header
                    if (cells.length > 1 && !trimmed.toLowerCase().contains("layer")) {
                        dataRowCount++;
                        String lastCell = cells[cells.length - 1].trim();
                        if (!lastCell.equalsIgnoreCase("known") && !lastCell.equalsIgnoreCase("new")) {
                            missingKnownOrNew = true;
                        }
                    }
                }
            }
            if (dataRowCount < 4) {
                warnings.add("Tech stack table has " + dataRowCount + " rows, recommended at least 4 rows");
            }
            if (missingKnownOrNew && dataRowCount > 0) {
                warnings.add("A row in the tech stack table is missing Known or New value");
            }
        }

        // Mermaid block check
        int mermaidCount = countOccurrences(answer, "```mermaid");
        if (mermaidCount != 1) {
            warnings.add("Expected exactly one mermaid diagram code block (found " + mermaidCount + ")");
        }

        boolean valid = errors.isEmpty();
        String summary = valid ? "Tech stack and architecture sections validated" : "Validation failed";
        return new ValidationResult(valid, errors, warnings, summary, sections.getSections());
    }

    private int countOccurrences(String str, String find) {
        int count = 0;
        int idx = 0;
        while ((idx = str.indexOf(find, idx)) != -1) {
            count++;
            idx += find.length();
        }
        return count;
    }
}
