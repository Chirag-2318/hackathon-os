package com.hackathonos.backend.checkpoints.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class CheckpointDtos {

    public record CheckpointProgressDto(
            int current,
            int target
    ) {}

    public record CheckpointItemDto(
            UUID id,
            String key,
            String title,
            String helper,
            String tag,
            Instant dueAt,
            String status, // "passed", "current", "upcoming"
            Instant passedAt,
            CheckpointProgressDto progress
    ) {}

    public record CheckpointsResponseDto(
            List<CheckpointItemDto> items,
            int passedCount,
            int total,
            CheckpointItemDto next
    ) {}

    public record PassCheckpointRequest(
            Boolean passed
    ) {}

    public record UpdateProgressRequest(
            Integer current
    ) {}
}
