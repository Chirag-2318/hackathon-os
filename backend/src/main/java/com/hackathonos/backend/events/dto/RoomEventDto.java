package com.hackathonos.backend.events.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RoomEventDto(
        Long id,
        String type,
        String entityType,
        String entityId,
        UUID actorUserId,
        Instant createdAt
) {
    public record FeedResponse(
            List<RoomEventDto> events,
            long latestId,
            boolean hasMore
    ) {}

    public record LatestEventResponse(
            long latestId
    ) {}

    public record SsePayload(
            Long id,
            String type,
            String entityType,
            String entityId,
            UUID actorUserId
    ) {}
}
