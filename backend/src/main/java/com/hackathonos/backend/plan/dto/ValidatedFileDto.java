package com.hackathonos.backend.plan.dto;

import java.util.List;

public record ValidatedFileDto(
        String name,
        int chars,
        String detectedAs,
        List<String> sections
) {}
