package com.hackathonos.backend.tasks.dto;

import java.util.UUID;

public record TaskUserDto(
        UUID userId,
        String name,
        String initials,
        String avatarUrl
) {}
