package com.hackathonos.backend.tasks.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TaskDto(
        UUID id,
        String key,
        String summary,
        String description,
        String status, // "todo", "inprogress", "done"
        boolean flagged,
        String blockedReason,
        String priority, // "highest", "high", "medium", "low", "lowest"
        TaskPhaseSummaryDto phase,
        UUID phaseId,
        String role,
        List<String> labels,
        int estimateMin,
        Instant dueAt,
        TaskUserDto assignee,
        UUID assigneeId,
        TaskUserDto reporter,
        UUID reporterId,
        List<TaskSubtaskDto> subtasks,
        int subtasksDone,
        int subtaskCount,
        List<TaskAcceptanceDto> acceptance,
        List<TaskDependencyItemDto> dependsOn,
        List<TaskDependencyItemDto> blocks,
        int commentCount,
        Instant createdAt,
        Instant updatedAt,
        Instant completedAt,
        long version,
        boolean hasBranch
) {}
