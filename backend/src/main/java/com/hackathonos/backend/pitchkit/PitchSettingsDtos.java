package com.hackathonos.backend.pitchkit;

import java.util.List;
import java.util.UUID;

public class PitchSettingsDtos {

    public record PitchSettingsDto(
            UUID roomId,
            String format,
            int pitchLimitSec,
            int qaLimitSec,
            UUID presenterUserId,
            UUID operatorUserId,
            boolean locked,
            UUID lockedBy,
            int wpm,
            int version
    ) {}

    public record PatchPitchSettingsRequest(
            String format,
            Integer pitchLimitSec,
            Integer qaLimitSec,
            UUID presenterUserId,
            UUID operatorUserId,
            Boolean locked,
            Integer wpm,
            Integer version
    ) {}

    public record PitchKitReadinessItem(
            String id,
            String label,
            String status, // READY, PARTIAL, MISSING
            String detail,
            String route,
            int weight
    ) {}

    public record PitchKitReadinessResponse(
            int readyCount,
            int totalCount,
            int scorePercent,
            List<PitchKitReadinessItem> items
    ) {}
}
