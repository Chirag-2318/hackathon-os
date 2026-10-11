package com.hackathonos.backend.users.dto;

import java.time.Instant;
import java.util.UUID;

public record UserDetailDto(
        UUID id,
        String name,
        String displayName,
        String firstName,
        String initials,
        String email,
        String avatarUrl,
        String provider,
        String timezone,
        String theme,
        String plan,
        Instant createdAt,
        long unreadNotifications
) {}
