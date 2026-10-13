package com.hackathonos.backend.brief.dto;

public record ExtractBriefResponseDto(
        boolean applied,
        BriefFieldsDto fields,
        BriefResponseDto brief,
        int extractedFieldsCount
) {}
