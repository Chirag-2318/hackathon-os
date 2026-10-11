package com.hackathonos.backend.schedule;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ScheduleDtos {

    public record ScheduleBlockDto(
            String name,
            Instant startAt,
            Instant endAt
    ) {}

    public record ScheduleCheckpointDto(
            String title,
            Instant dueAt,
            String status
    ) {}

    public record ScheduleEventDto(
            UUID id,
            String title,
            String kind,
            String type,
            Instant startsAt,
            Instant endsAt,
            Instant startTime,
            Instant endTime,
            String notes,
            String phaseColorRef
    ) {}

    public record ScheduleResponse(
            List<ScheduleBlockDto> blocks,
            List<ScheduleCheckpointDto> checkpoints,
            List<ScheduleEventDto> events,
            Instant now
    ) {}

    public record CreateEventRequest(
            String title,
            String kind,
            Instant startsAt,
            Instant endsAt,
            String notes
    ) {}

    public record UpdateEventRequest(
            String title,
            String kind,
            Instant startsAt,
            Instant endsAt,
            String notes
    ) {}
}
