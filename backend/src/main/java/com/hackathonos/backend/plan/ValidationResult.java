package com.hackathonos.backend.plan;

import java.util.List;

public record ValidationResult(
        boolean valid,
        List<String> errors,
        List<String> warnings,
        String summary,
        Object parsed
) {}
