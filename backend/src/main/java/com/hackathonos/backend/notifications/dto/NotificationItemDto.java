package com.hackathonos.backend.notifications.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationItemDto(
        UUID id,
        UUID roomId,
        String roomName,
        String type,
        String title,
        String body,
        String message,
        String linkPath,
        String link,
        String deepLink,
        int count,
        boolean read,
        Instant readAt,
        Instant createdAt
) {
    public NotificationItemDto(
            UUID id,
            UUID roomId,
            String roomName,
            String type,
            String title,
            String body,
            String message,
            String linkPath,
            String link,
            boolean read,
            Instant readAt,
            Instant createdAt
    ) {
        this(id, roomId, roomName, type, title, body, message, linkPath, link,
                linkPath != null ? linkPath : link, 1, read, readAt, createdAt);
    }
}
