package com.hackathonos.backend.brief.dto;

import java.util.List;

public record FileIntakeResponse(
        String sourceText,
        int chars,
        int pages,
        boolean truncated,
        List<String> warnings,
        boolean saved,
        BriefFieldsDto fields,
        BriefResponseDto brief
) {}
