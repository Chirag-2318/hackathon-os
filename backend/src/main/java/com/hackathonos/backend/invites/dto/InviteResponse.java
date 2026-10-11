package com.hackathonos.backend.invites.dto;

import java.time.Instant;

public record InviteResponse(
        String token,
        String url,
        Instant expiresAt
) {}
