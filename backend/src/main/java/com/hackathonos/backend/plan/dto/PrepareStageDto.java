package com.hackathonos.backend.plan.dto;

public record PrepareStageDto(
        String key,
        String label,
        String state,
        String detail,
        String startedAt,
        String endedAt
) {}
