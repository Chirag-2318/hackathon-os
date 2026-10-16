package com.hackathonos.backend.users.dto;

import java.time.Instant;

public record UserPreferenceDto(
        String theme,
        String textSize,
        String motion,
        String sidebarDefault,
        String timeFormat,
        String timezone,
        Instant updatedAt
) {}
