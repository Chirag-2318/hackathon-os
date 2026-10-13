package com.hackathonos.backend.rooms.dto;

import java.time.Instant;

/**
 * Canonical nested clock DTO returned in all room responses.
 * Provides synchronized time calculations and server timestamp for client clock drift correction.
 */
public record RoomClockDto(
        String clockStatus,
        Instant serverNow,
        Instant startsAt,
        Instant freezeAt,
        Instant endsAt,
        double elapsedPercent,
        int hourIndex,
        int durationHours,
        long msToFreeze,
        long msToDeadline,
        long startsInMs
) {}
