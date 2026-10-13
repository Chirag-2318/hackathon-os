package com.hackathonos.backend.plan.dto;

import java.util.List;

public record PlanPromptResponseDto(
        String prompt,
        int charCount,
        String mode,
        String ideaVerdict,
        List<String> missingInputs,
        boolean stale,
        String generatedAt
) {}
