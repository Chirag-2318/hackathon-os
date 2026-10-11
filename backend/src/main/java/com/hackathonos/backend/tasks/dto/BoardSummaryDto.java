package com.hackathonos.backend.tasks.dto;

public record BoardSummaryDto(
        long total,
        long open,
        long todo,
        long inProgress,
        long blocked,
        long done,
        long unassigned,
        long dueToday
) {}
