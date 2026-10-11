package com.hackathonos.backend.overview.attention;

import java.util.List;
import java.util.UUID;

public record AttentionItem(
        String id,
        String type,
        String severity, // "red", "amber", "purple", "gray"
        String title,
        String helper,
        String actionLabel,
        String actionRoute,
        List<AttentionOwnerDto> owners
) {
    public record AttentionOwnerDto(
            UUID userId,
            String name,
            String avatarUrl
    ) {}
}
