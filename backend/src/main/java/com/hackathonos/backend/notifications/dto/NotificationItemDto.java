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
        boolean read,
        Instant readAt,
        Instant createdAt
) {}
