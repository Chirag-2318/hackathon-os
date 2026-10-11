package com.hackathonos.backend.plan.validators;

import com.hackathonos.backend.plan.MarkdownSections;
import com.hackathonos.backend.plan.ValidationResult;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Validates PRD & MVP plan step structure, heading sequence, and completeness.
 */
@Component
public class PrdValidator {

    private static final List<String> REQUIRED_HEADINGS = List.of(
            "# PRD",
            "## Problem",
            "## Target user",
            "## One-sentence identity",
            "## Core flow",
            "## Wow moment",
            "## Must-have features",
            "## Out of scope",
            "# MVP",
            "## The one end-to-end flow",
            "## Real vs mocked",
            "## Cut list",
            "## Risks and fallbacks"
    );

    public ValidationResult validate(String answer) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (answer == null || answer.isBlank()) {
            errors.add("Answer is empty");
            return new ValidationResult(false, errors, warnings, "Validation failed", null);
        }

        MarkdownSections sections = MarkdownSections.parse(answer);

        for (String heading : REQUIRED_HEADINGS) {
            if (!sections.hasHeading(heading)) {
                errors.add("Missing required heading: \"" + heading + "\"");
            }
        }

        List<String> coreFlowItems = sections.getNumberedItems("## Core flow");
        if (sections.hasHeading("## Core flow") && (coreFlowItems.size() < 3 || coreFlowItems.size() > 5)) {
            warnings.add("Core flow has " + coreFlowItems.size() + " items, recommended 3 to 5 numbered items");
        }

        List<String> cutListItems = sections.getBulletItems("## Cut list");
        if (sections.hasHeading("## Cut list") && cutListItems.size() < 3) {
            warnings.add("Cut list has " + cutListItems.size() + " bullets, recommended at least 3 bullets");
        }

        if (sections.hasHeading("## Real vs mocked") && !sections.hasTable("## Real vs mocked")) {
            warnings.add("No Markdown table found under \"## Real vs mocked\"");
        }

        boolean valid = errors.isEmpty();
        String summary = valid
                ? REQUIRED_HEADINGS.size() + " sections found, " + coreFlowItems.size() + " core-flow steps"
                : "Validation failed with " + errors.size() + " missing headings";

        return new ValidationResult(valid, errors, warnings, summary, sections.getSections());
    }
}
