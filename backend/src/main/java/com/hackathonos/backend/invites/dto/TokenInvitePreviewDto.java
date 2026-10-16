package com.hackathonos.backend.invites.dto;

import java.time.Instant;

public record TokenInvitePreviewDto(
        String roomName,
        String templateName,
        String duration,
        String inviterUsername,
        String inviterDisplayName,
        String inviterAvatarUrl,
        long memberCount,
        int memberCap,
        Instant expiresAt
) {}
