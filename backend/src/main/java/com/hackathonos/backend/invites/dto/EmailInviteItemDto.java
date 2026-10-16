package com.hackathonos.backend.invites.dto;

import java.time.Instant;
import java.util.UUID;

public record EmailInviteItemDto(
        UUID id,
        String email,
        String invitedByName,
        UUID invitedById,
        Instant createdAt,
        Instant expiresAt,
        int sendCount,
        String note,
        String status
) {}
