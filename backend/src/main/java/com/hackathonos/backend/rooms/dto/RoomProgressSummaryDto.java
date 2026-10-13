package com.hackathonos.backend.rooms.dto;

/**
 * Aggregated zero-safe progress counters computed per room.
 */
public record RoomProgressSummaryDto(
        long tasksDone,
        long tasksTotal,
        boolean hasTasks,
        long stepsValidated,
        long stepsTotal,
        long checklistDone,
        long checklistTotal
) {}
