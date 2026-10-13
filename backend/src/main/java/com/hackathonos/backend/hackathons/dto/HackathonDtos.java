package com.hackathonos.backend.hackathons.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class HackathonDtos {

    public record HackathonSourceItemDto(
            String title,
            String organizer,
            String url,
            String source,
            String mode,
            @JsonProperty("starts_at") Instant startsAt,
            @JsonProperty("ends_at") Instant endsAt,
            @JsonProperty("registration_deadline") Instant registrationDeadline,
            @JsonProperty("prize_text") String prizeText,
            Object themes,
            String location,
            @JsonProperty("team_min") Short teamMin,
            @JsonProperty("team_max") Short teamMax,
            @JsonProperty("verified_at") Instant verifiedAt,
            Boolean active
    ) {}

    public record HackathonItemDto(
            UUID id,
            String title,
            String organizer,
            String url,
            String source,
            String mode,
            Instant startsAt,
            Instant endsAt,
            Instant registrationDeadline,
            String prizeText,
            List<String> themes,
            String location,
            Short teamMin,
            Short teamMax,
            Instant verifiedAt,
            long msToEnd,
            Long msToRegistrationClose,
            double elapsedPercent
    ) {}

    public record HackathonLiveResponseDto(
            Instant serverNow,
            List<HackathonItemDto> items
    ) {}

    public record HackathonSuggestionRequest(
            String url,
            String note
    ) {}
}
