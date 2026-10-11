package com.hackathonos.backend.tasks.dto;

import java.time.Instant;
import java.util.UUID;

public record TaskHistoryDto(
        UUID id,
        TaskUserDto actor,
        String text,
        Instant createdAt
) {}
