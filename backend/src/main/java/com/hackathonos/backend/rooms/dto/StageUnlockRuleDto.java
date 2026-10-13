package com.hackathonos.backend.rooms.dto;

/**
 * Reason and status explaining what unlocks each stage in the room summary.
 */
public record StageUnlockRuleDto(
        String stage,
        boolean unlocked,
        String reason
) {}
