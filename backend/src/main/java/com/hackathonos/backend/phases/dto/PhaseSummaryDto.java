package com.hackathonos.backend.phases.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PhaseSummaryDto(
        UUID id,
        String key,
        String name,
        int position,
        String status,
        String goal,
        String exitCheckpoint,
        String owners,
        String deliverables,
        String rawMarkdown,
        TaskCountsDto taskCounts,
        double hoursPlanned,
        double hoursConfirmed,
        PhaseWindowDto window,
        boolean overdue,
        boolean ready,
        boolean tasksGenerated,
        boolean isCurrent,
        String nextPhaseKey
) {
    public record TaskCountsDto(int total, int confirmed, int awaiting, int inProgress, int todo, int dropped) {}
    public record PhaseWindowDto(BigDecimal startHour, BigDecimal endHour, Instant startTime, Instant endTime) {}
}
