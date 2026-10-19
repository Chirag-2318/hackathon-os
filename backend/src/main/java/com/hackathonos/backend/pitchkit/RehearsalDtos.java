package com.hackathonos.backend.pitchkit;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class RehearsalDtos {

    private RehearsalDtos() {}

    public record StartRehearsalRequest(
            String mode, // TIMED | VOICE
            String scope, // FULL | MY_BEATS | ONE_BEAT
            List<String> beatIds
    ) {}

    public record StartRehearsalResponse(
            UUID id,
            List<PitchDtos.PitchBeatDto> beats,
            int limitSec
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record BeatTimingDto(
            String beatId,
            long plannedMs,
            long actualMs,
            long startedAtMs
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record StumbleDto(
            long atMs,
            String beatId
    ) {}

    public record FinishRehearsalRequest(
            List<BeatTimingDto> beatTimings,
            List<StumbleDto> stumbles,
            String endedReason // COMPLETE | STOPPED
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record BeatMetricDto(
            String beatId,
            int wpm,
            int fillerCount,
            int scriptCoveragePct,
            List<String> missedPhrases,
            long deltaMs
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RehearsalMetricsDto(
            int overallWpm,
            int totalFillers,
            double fillersPerMin,
            int overallCoveragePct,
            int totalStumbles,
            long totalDeltaMs,
            String slowestBeatId,
            long slowestBeatDeltaMs,
            List<BeatMetricDto> beatMetrics
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CoachFixItem(
            String issue,
            String evidence,
            String drill
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CoachFeedbackDto(
            List<String> worked,
            List<CoachFixItem> fix,
            String oneDrill
    ) {}

    public record RehearsalDeltaDto(
            Integer wpmDelta,
            Long durationDeltaMs,
            Integer fillersDelta,
            Integer coverageDeltaPct
    ) {}

    public record RehearsalSummaryResponse(
            UUID id,
            UUID roomId,
            UUID userId,
            String userName,
            String mode,
            String scope,
            Instant startedAt,
            long durationMs,
            long plannedMs,
            boolean completed,
            int completionPct,
            boolean countsTowardReadiness,
            RehearsalDeltaDto delta
    ) {}

    public record RehearsalDetailResponse(
            UUID id,
            UUID roomId,
            UUID userId,
            String userName,
            int pitchVersion,
            String mode,
            String scope,
            Instant startedAt,
            Instant endedAt,
            long durationMs,
            long plannedMs,
            boolean completed,
            int completionPct,
            boolean countsTowardReadiness,
            List<BeatTimingDto> beatTimings,
            List<StumbleDto> stumbles,
            Map<String, String> transcript,
            RehearsalMetricsDto metrics,
            CoachFeedbackDto coach,
            RehearsalDeltaDto delta,
            List<PitchDtos.PitchBeatDto> beats
    ) {}
}
