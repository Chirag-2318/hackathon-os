package com.hackathonos.backend.tasks.dto;

import java.time.Instant;
import java.util.UUID;

public record TaskPhaseSummaryDto(
        UUID id,
        String name,
        Instant startAt,
        Instant endAt
) {
    public TaskPhaseSummaryDto(UUID id, String name) {
        this(id, name, null, null);
    }
}
