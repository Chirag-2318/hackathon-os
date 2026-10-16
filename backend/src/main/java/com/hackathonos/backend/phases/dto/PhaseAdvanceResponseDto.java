package com.hackathonos.backend.phases.dto;

import java.util.List;
import java.util.UUID;

public record PhaseAdvanceResponseDto(
        boolean buildComplete,
        String nextPhaseKey,
        List<UnfinishedTaskDto> unfinishedTasks
) {
    public record UnfinishedTaskDto(UUID id, String taskKey, String summary, String assigneeHandle, String status, double estimateHours) {}
}
