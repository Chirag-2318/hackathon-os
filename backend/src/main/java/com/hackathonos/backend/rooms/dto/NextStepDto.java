package com.hackathonos.backend.rooms.dto;

/**
 * Computed actionable next step for a team room.
 * Feeds Overview hero, sidebar footer, Home summary, and My Rooms list cards.
 */
public record NextStepDto(
        String label,
        String route,
        String reason
) {}
