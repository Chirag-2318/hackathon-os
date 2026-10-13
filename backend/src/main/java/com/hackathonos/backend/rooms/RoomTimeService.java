package com.hackathonos.backend.rooms;

import com.hackathonos.backend.rooms.dto.RoomClockDto;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

/**
 * Single source of truth for all room time calculations.
 * Computes unified clock status, remaining time, elapsed metrics, and drift synchronization.
 */
@Service
public class RoomTimeService {

    private final Clock clock;

    public RoomTimeService(Clock clock) {
        this.clock = clock;
    }

    public Instant now() {
        return clock.instant();
    }

    public RoomClockDto computeClock(Room room) {
        Instant serverNow = now();
        return computeClock(room, serverNow);
    }

    public RoomClockDto computeClock(Room room, Instant serverNow) {
        if (room == null) {
            return new RoomClockDto("UPCOMING", serverNow, serverNow, serverNow, serverNow, 0.0, 0, 36, 0, 0, 0);
        }

        Instant startsAt = room.getStartsAt() != null ? room.getStartsAt()
                : (room.getCreatedAt() != null ? room.getCreatedAt() : serverNow);
        int durationHours = room.getDurationHours() > 0 ? room.getDurationHours() : 36;
        Instant endsAt = room.getEndsAt() != null ? room.getEndsAt()
                : startsAt.plus(Duration.ofHours(durationHours));
        Instant freezeAt = room.getFreezeAt() != null ? room.getFreezeAt()
                : startsAt.plus(Duration.ofMillis((long) (durationHours * 3600_000L * 0.70)));

        long totalMs = Math.max(1L, Duration.between(startsAt, endsAt).toMillis());

        long elapsedMs;
        if (serverNow.isBefore(startsAt)) {
            elapsedMs = 0;
        } else if (serverNow.isAfter(endsAt)) {
            elapsedMs = totalMs;
        } else {
            elapsedMs = Duration.between(startsAt, serverNow).toMillis();
        }

        double elapsedPercent = Math.min(100.0, Math.max(0.0, (elapsedMs * 100.0) / totalMs));
        int hourIndex = Math.min(durationHours, Math.max(0, (int) (elapsedMs / (3600_000L))));

        long remainingMs = Math.max(0L, Duration.between(serverNow, endsAt).toMillis());
        long msToFreeze = freezeAt != null ? Math.max(0L, Duration.between(serverNow, freezeAt).toMillis()) : 0L;
        long msToDeadline = remainingMs;
        long startsInMs = serverNow.isBefore(startsAt) ? Math.max(0L, Duration.between(serverNow, startsAt).toMillis()) : 0L;

        String clockStatus;
        if (room.getSubmittedAt() != null) {
            clockStatus = "SUBMITTED";
        } else if (serverNow.isBefore(startsAt)) {
            clockStatus = "UPCOMING";
        } else if (!serverNow.isBefore(endsAt)) {
            clockStatus = "ENDED";
        } else if (freezeAt != null && !serverNow.isBefore(freezeAt)) {
            clockStatus = "FROZEN";
        } else {
            clockStatus = "LIVE";
        }

        return new RoomClockDto(
                clockStatus,
                serverNow,
                startsAt,
                freezeAt,
                endsAt,
                elapsedPercent,
                hourIndex,
                durationHours,
                msToFreeze,
                msToDeadline,
                startsInMs
        );
    }
}
