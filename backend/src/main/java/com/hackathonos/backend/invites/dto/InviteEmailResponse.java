package com.hackathonos.backend.invites.dto;

public record InviteEmailResponse(
        String token,
        String link,
        String email,
        String role,
        String status
) {}
