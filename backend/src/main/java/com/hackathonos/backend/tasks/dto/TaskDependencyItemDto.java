package com.hackathonos.backend.tasks.dto;

import java.util.UUID;

public record TaskDependencyItemDto(
        UUID id,
        String key,
        String summary,
        String status
) {}
