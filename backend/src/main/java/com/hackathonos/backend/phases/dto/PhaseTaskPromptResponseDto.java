package com.hackathonos.backend.phases.dto;

public record PhaseTaskPromptResponseDto(
        String prompt,
        int charCount,
        String mode,
        String outputFileName,
        String bundleName,
        String targets,
        boolean stale,
        boolean canRegenerate
) {}
