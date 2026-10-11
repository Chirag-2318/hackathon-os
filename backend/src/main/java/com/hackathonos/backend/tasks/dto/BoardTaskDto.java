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
        int commentCount
) {}
