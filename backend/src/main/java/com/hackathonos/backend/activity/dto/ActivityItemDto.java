package com.hackathonos.backend.activity.dto;

import java.time.Instant;
import java.util.UUID;

public record ActivityItemDto(
        UUID id,
        ActorDto actor,
        String type,
        String summary,
        Instant createdAt
) {}
