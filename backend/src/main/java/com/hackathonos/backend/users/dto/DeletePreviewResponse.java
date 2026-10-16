package com.hackathonos.backend.users.dto;

import java.util.List;
import java.util.UUID;

public record DeletePreviewResponse(
        List<BlockerRoom> blockers,
        List<WillDeleteRoom> willDelete,
        WillAnonymiseSummary willAnonymise
) {
    public record BlockerRoom(
            UUID id,
            String name,
            long memberCount
    ) {}

    public record WillDeleteRoom(
            UUID id,
            String name
    ) {}

    public record WillAnonymiseSummary(
            long ideasCount,
            long tasksCount,
            long commentsCount
    ) {}
}
