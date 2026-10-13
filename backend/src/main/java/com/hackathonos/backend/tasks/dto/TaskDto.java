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
        boolean hasBranch,
        List<TaskDependencyItemDto> prerequisites,
        boolean isBlocked,
        String reviewState,
        String reviewNote,
        Instant confirmedAt,
        UUID confirmedBy
) {
    public TaskDto(
            UUID id,
            String key,
            String summary,
            String description,
            String status,
            boolean flagged,
            String blockedReason,
            String priority,
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
    ) {
        this(
                id, key, summary, description, status, flagged, blockedReason, priority,
                phase, phaseId, role, labels, estimateMin, dueAt, assignee, assigneeId,
                reporter, reporterId, subtasks, subtasksDone, subtaskCount, acceptance,
                dependsOn, blocks, commentCount, createdAt, updatedAt, completedAt, version,
                hasBranch, dependsOn,
                dependsOn != null && dependsOn.stream().anyMatch(d -> !d.confirmed()),
                "done".equalsIgnoreCase(status) ? "CONFIRMED" : "NONE",
                null,
                "done".equalsIgnoreCase(status) ? completedAt : null,
                null
        );
    }
}
