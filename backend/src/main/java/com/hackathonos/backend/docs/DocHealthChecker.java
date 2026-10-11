package com.hackathonos.backend.docs;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class DocHealthChecker {

    public record DocHealthDto(
            String status, // "ok" | "warning"
            List<String> issues
    ) {}

    /**
     * Evaluates document health checks based on file name requirements.
     */
    public DocHealthDto check(String fileName, String content) {
        if (content == null || content.isBlank()) {
            return new DocHealthDto("warning", List.of("Document content is empty"));
        }

        List<String> issues = new ArrayList<>();
        String name = fileName != null ? fileName.toUpperCase() : "";

        if (name.equals("PRD.MD")) {
            if (!content.contains("# PRD")) issues.add("Missing '# PRD' heading");
            if (!content.contains("## Problem")) issues.add("Missing '## Problem' section");
            if (!content.contains("## Core flow")) issues.add("Missing '## Core flow' section");
        } else if (name.equals("MVP.MD")) {
            if (!content.contains("# MVP")) issues.add("Missing '# MVP' heading");
        } else if (name.equals("TECH_STACK.MD")) {
            boolean hasTable = content.contains("|") && content.contains("---");
            if (!hasTable) issues.add("Missing markdown table");
            boolean hasMermaid = content.contains("```mermaid");
            if (!hasMermaid) issues.add("Missing mermaid architecture diagram block");
        } else if (name.equals("PHASES.MD")) {
            boolean hasTable = content.contains("|") && content.contains("---");
            if (!hasTable) issues.add("Missing sprint phases table");
        } else if (name.equals("DEMO_SCRIPT.MD")) {
            if (!content.contains("# Demo script") && !content.contains("## Demo script")) {
                issues.add("Missing '# Demo script' section");
            }
        } else if (name.equals("QA.MD")) {
            if (!content.contains("# Likely judge Q&A") && !content.contains("## Likely judge Q&A")) {
                issues.add("Missing '# Likely judge Q&A' section");
            }
        }

        if (issues.isEmpty()) {
            return new DocHealthDto("ok", Collections.emptyList());
        }
        return new DocHealthDto("warning", issues);
    }
}
