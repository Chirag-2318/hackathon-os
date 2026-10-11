package com.hackathonos.backend.brief.dto;

import java.util.List;

public record ValidateExtractResponse(
        boolean valid,
        List<String> errors,
        List<String> warnings,
        BriefFieldsDto fields,
        BriefResponseDto brief
) {}
