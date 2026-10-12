package com.hackathonos.backend.rooms.dto;

import com.hackathonos.backend.users.dto.UserSummaryDto;
import java.time.Instant;
import java.util.List;
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
        Instant createdAt,
        int durationHours,
        String phase,
        int phaseIndex,
        int phaseCount,
        Instant startsAt,
        Instant endsAt,
        Instant submittedAt,
        List<UserSummaryDto> memberPreview,
        String nextStepLabel,
        int attentionCount
) {
    public record JourneyProgress(int done, int total) {}

    public RoomListItemDto(
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
        this(
                id,
                name,
                description,
                templateId,
                templateName,
                stage,
                eventStart,
                eventEnd,
                memberCount,
                myRole,
                isLeader,
                journey,
                createdAt,
                36,
                "Planning",
                0,
                4,
                eventStart,
                eventEnd,
                null,
                List.of(),
                null,
                0
        );
    }
}
