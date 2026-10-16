package com.hackathonos.backend.plan.dto;

public record ValidationIssueDto(
        String severity, // BLOCK | WARN
        String code,
        String file,
        Integer line,
        String message,
        String expected,
        String found
) {}
