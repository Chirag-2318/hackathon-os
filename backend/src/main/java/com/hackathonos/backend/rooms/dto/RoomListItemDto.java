package com.hackathonos.backend.rooms.dto;

import java.time.Instant;
import java.util.UUID;

public record RoomListItemDto(
        UUID id,
        String name,
        String description,
        String templateId,
        String templateName,
        String stage,
        Instant eventStart,
        Instant eventEnd,
        long memberCount,
        String myRole,
        boolean isLeader,
        JourneyProgress journey,
        Instant createdAt
) {
    public record JourneyProgress(int done, int total) {}
}
