package com.hackathonos.backend.users.dto;

public record UpdateUserPreferenceRequest(
        String theme,
        String textSize,
        String motion,
        String sidebarDefault,
        String timeFormat,
        String timezone
) {}
