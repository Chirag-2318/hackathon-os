package com.hackathonos.backend.rooms.dto;

import java.util.List;

public record JourneyDto(
        String stage,
        List<JourneyStepDto> steps,
        boolean buildUnlocked
) {
    public record JourneyStepDto(
            String key,
            String label,
            String status,
            String helper
    ) {}
}
