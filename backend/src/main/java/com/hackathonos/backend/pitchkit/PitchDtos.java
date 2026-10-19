package com.hackathonos.backend.pitchkit;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class PitchDtos {

    private PitchDtos() {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PitchBeatDto(
            String id,
            String title,
            int durationSec,
            String say,
            String show,
            String cue,
            UUID speakerUserId,
            String slideRef
    ) {}

    public record PitchDetailResponse(
            UUID roomId,
            int version,
            List<PitchBeatDto> beats,
            int timeLimitSec,
            String source,
            Integer docVersion,
            UUID updatedBy,
            String updatedByName,
            Instant updatedAt
    ) {}

    public record UpdatePitchRequest(
            Integer expectedVersion,
            List<PitchBeatDto> beats,
            Integer timeLimitSec
    ) {}

    public record PullFromDocResponse(
            String diff,
            List<PitchBeatDto> beats,
            boolean applied,
            int version
    ) {}

    public record PushToDocResponse(
            int docVersion
    ) {}

    public record PitchVersionSummary(
            UUID id,
            int version,
            String note,
            UUID createdBy,
            String createdByName,
            Instant createdAt,
            int beatCount
    ) {}

    public record MatchingBeatDto(
            String id,
            String title
    ) {}

    public record RubricCoverageDto(
            String criterion,
            int weight,
            List<MatchingBeatDto> matchingBeats
    ) {}

    public record PitchAiEditRequest(
            String action, // "Tighten to fit" | "Punchier" | "Explain the jargon"
            String beatSay,
            String title,
            Integer targetSeconds
    ) {}

    public record PitchAiEditResponse(
            String proposedText,
            String diff
    ) {}
}
