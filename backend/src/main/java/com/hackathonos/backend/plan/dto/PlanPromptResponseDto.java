package com.hackathonos.backend.plan.dto;

import java.util.List;

public record PlanPromptResponseDto(
        String prompt,
        int charCount,
        String mode,
        String ideaVerdict,
        List<String> missingInputs,
        boolean stale,
        String generatedAt,
        String analysisState,
        boolean ready,
        List<String> outputFiles,
        String bundleName
) {
    public PlanPromptResponseDto(
            String prompt,
            int charCount,
            String mode,
            String ideaVerdict,
            List<String> missingInputs,
            boolean stale,
            String generatedAt
    ) {
        this(prompt, charCount, mode, ideaVerdict, missingInputs, stale, generatedAt, "READY", true, List.of(), null);
    }
}
