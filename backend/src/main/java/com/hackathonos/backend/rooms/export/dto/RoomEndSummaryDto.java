package com.hackathonos.backend.rooms.export.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * End-of-event shareable room summary capturing milestones, stats, links, and retro highlights.
 * Only populated fields are serialized.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RoomEndSummaryDto(
        UUID roomId,
        String roomName,
        String templateName,
        Instant startsAt,
        Instant endsAt,
        Instant submittedAt,
        List<TeamMemberSummaryDto> team,
        TimelineMilestonesDto timeline,
        EventStatsDto stats,
        ProjectLinksDto links,
        List<String> retroHighlights
) {
    public record TeamMemberSummaryDto(
            UUID userId,
            String username,
            String displayName,
            String role,
            String avatarUrl
    ) {}

    public record PhaseMilestoneDto(
            String name,
            Instant completedAt
    ) {}

    public record TimelineMilestonesDto(
            Instant roomCreated,
            Instant firstTaskCompleted,
            Instant planValidated,
            Instant firstDemoRecorded,
            Instant submissionStarted,
            Instant submittedAt,
            Instant briefConfirmed,
            Instant buildStarted,
            List<PhaseMilestoneDto> phases
    ) {
        public TimelineMilestonesDto(
                Instant roomCreated,
                Instant firstTaskCompleted,
                Instant planValidated,
                Instant firstDemoRecorded,
                Instant submissionStarted,
                Instant submittedAt
        ) {
            this(roomCreated, firstTaskCompleted, planValidated, firstDemoRecorded, submissionStarted, submittedAt, null, null, null);
        }
    }

    public record EventStatsDto(
            int tasksCompleted,
            int totalTasks,
            int ideasAccepted,
            int docsWritten
    ) {}

    public record ProjectLinksDto(
            String repoUrl,
            String deckUrl,
            String demoVideoUrl,
            String liveUrl
    ) {}
}
