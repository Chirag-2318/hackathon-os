package com.hackathonos.backend.tasks.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CreateTaskRequest(
        @NotBlank @Size(min = 3, max = 200) String summary,
        String description,
        String status,
        UUID assigneeId,
        String priority,
        UUID phaseId,
        String role,
        Integer estimateMin,
        Instant dueAt,
        List<String> labels
) {}
