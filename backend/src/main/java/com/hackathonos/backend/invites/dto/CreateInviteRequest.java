package com.hackathonos.backend.invites.dto;

public record CreateInviteRequest(
        String role,
        Integer expiresInDays,
        Integer maxUses
) {}
