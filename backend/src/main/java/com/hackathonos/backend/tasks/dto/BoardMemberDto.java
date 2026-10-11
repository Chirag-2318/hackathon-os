package com.hackathonos.backend.tasks.dto;

public record BoardMemberDto(
        String id,
        String displayName,
        String role,
        String avatarUrl
) {}
