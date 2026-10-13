package com.hackathonos.backend.tasks.dto;

public record BoardTaskDto(
        String id,
        String key,
        String summary,
        String status,
        boolean flagged,
        String blockedReason,
        String priority,
        String role,
        TaskPhaseDto phase,
        TaskAssigneeDto assignee,
        int estimateMin,
        String dueAt,
        int subtaskCount,
        int subtasksDone,
        int commentCount,
        boolean isBlocked,
        int blockedByCount,
        int unblocksCount,
        String reviewState,
        boolean confirmed
) {
    public BoardTaskDto(
            String id,
            String key,
            String summary,
            String status,
            boolean flagged,
            String blockedReason,
            String priority,
            String role,
            TaskPhaseDto phase,
            TaskAssigneeDto assignee,
            int estimateMin,
            String dueAt,
            int subtaskCount,
            int subtasksDone,
            int commentCount
    ) {
        this(
                id, key, summary, status, flagged, blockedReason, priority, role,
                phase, assignee, estimateMin, dueAt, subtaskCount, subtasksDone,
                commentCount, false, 0, 0,
                "done".equalsIgnoreCase(status) ? "CONFIRMED" : "NONE",
                "done".equalsIgnoreCase(status)
        );
    }
}
