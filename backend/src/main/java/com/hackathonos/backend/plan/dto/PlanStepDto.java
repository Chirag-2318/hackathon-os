package com.hackathonos.backend.plan.dto;

import java.util.List;

public record PlanStepDto(
        String key,
        int index,
        String title,
        String status,
        String answer,
        boolean validated,
        List<String> errors,
        List<String> warnings,
        String promptText,
        String expectedFormat,
        int charCount,
        List<ContextFileDto> contextFiles,
        String mode,
        String ideaVerdict,
        boolean stale
) {
    public PlanStepDto(
            String key,
            int index,
            String title,
            String status,
            String answer,
            boolean validated,
            List<String> errors,
            List<String> warnings,
            String promptText,
            String expectedFormat,
            int charCount,
            List<ContextFileDto> contextFiles
    ) {
        this(key, index, title, status, answer, validated, errors, warnings, promptText, expectedFormat, charCount, contextFiles, "BALANCED", null, false);
    }
}
