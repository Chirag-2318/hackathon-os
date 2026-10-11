package com.hackathonos.backend.mentor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class MentorDtos {

    public record CreateMentorLinkRequest(
            Integer expiresInDays
    ) {}

    public record MentorLinkDto(
            UUID id,
            String token,
            String url,
            Instant expiresAt,
            Instant createdAt
    ) {}

    public record BlockedTaskDto(
            String key,
            String summary,
            String reason
    ) {}

    public record BoardSnapshotDto(
            int total,
            int todo,
            int inProgress,
            int done,
            List<BlockedTaskDto> blocked
    ) {}

    public record PlanSnapshotDto(
            String prdSummary,
            List<String> techStack
    ) {}

    public record MentorTeamMemberDto(
            String name,
            String role,
            List<String> skills
    ) {}

    public record RubricWeightDto(
            String name,
            int weightPercent
    ) {}

    public record FrontendContextSnapshot(
            String teamName,
            String problemStatement,
            String currentPhase,
            List<RubricWeightDto> rubricItems,
            Instant snapshotAt
    ) {}

    public record MentorContextResponse(
            String roomName,
            String projectName,
            String identity,
            String problem,
            String phase,
            long hoursLeft,
            PlanSnapshotDto plan,
            BoardSnapshotDto board,
            List<MentorTeamMemberDto> team,
            List<String> recentActivity,
            String askTemplate,
            Instant expiresAt,
            FrontendContextSnapshot context,
            Instant lastSyncedAt
    ) {}

    public record PublicAskRequest(
            String mentorName,
            String question
    ) {}

    public record MentorQuestionDto(
            UUID id,
            String mentorName,
            String question,
            String answer,
            String status,
            Instant createdAt,
            Instant answeredAt,
            String answeredBy
    ) {}

    public record AnswerQuestionRequest(
            String answer,
            String status
    ) {}
}
