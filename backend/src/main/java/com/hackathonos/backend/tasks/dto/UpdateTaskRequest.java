package com.hackathonos.backend.tasks.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UpdateTaskRequest(
        String summary,
        String description,
        String priority,
        UUID phaseId,
        String role,
        List<String> labels,
        Integer estimateMin,
        Instant dueAt,
        Long version
) {}
