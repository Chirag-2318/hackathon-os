package com.hackathonos.backend.prep;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class PrepDtos {

    public record CountdownDto(
            Instant startsAt,
            long hoursToStart
    ) {}

    public record PreWorkDto(
            Boolean allowed,
            String guidance
    ) {}

    public record PrepChecklistItemDto(
            UUID id,
            String label,
            boolean done,
            Instant dueAt,
            UUID doneBy
    ) {}

    public record PrepProgressDto(
            int done,
            int total
    ) {}

    public record PrepResponse(
            CountdownDto countdown,
            PreWorkDto preWork,
            List<PrepChecklistItemDto> checklist,
            PrepProgressDto progress,
            boolean githubConnected,
            boolean preExistingCodeAllowed,
            Instant serverNow
    ) {}

    public record CreatePrepItemRequest(
            String label,
            Instant dueAt
    ) {}

    public record TogglePrepItemRequest(
            Boolean done
    ) {}
}
