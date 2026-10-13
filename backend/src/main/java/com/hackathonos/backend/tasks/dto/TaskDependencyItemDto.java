package com.hackathonos.backend.tasks.dto;

import java.util.UUID;

public record TaskDependencyItemDto(
        UUID id,
        String key,
        String title,
        String summary,
        String status,
        boolean confirmed
) {
    public TaskDependencyItemDto(UUID id, String key, String title, String status, boolean confirmed) {
        this(id, key, title, title, status, confirmed);
    }

    public TaskDependencyItemDto(UUID id, String key, String summary, String status) {
        this(id, key, summary, summary, status, "done".equalsIgnoreCase(status));
    }
}
