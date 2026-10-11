package com.hackathonos.backend.plan.dto;

public record PlanCompletionSummaryDto(
        int docs,
        int phases,
        int tasks,
        int assigned,
        int unassigned,
        String completedAt
) {}
