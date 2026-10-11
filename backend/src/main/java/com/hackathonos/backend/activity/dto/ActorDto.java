package com.hackathonos.backend.activity.dto;

import java.util.UUID;

public record ActorDto(
        UUID userId,
        String name,
        String initials,
        String avatarUrl
) {}
