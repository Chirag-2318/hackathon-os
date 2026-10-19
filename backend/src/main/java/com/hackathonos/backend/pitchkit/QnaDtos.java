package com.hackathonos.backend.pitchkit;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class QnaDtos {

    private QnaDtos() {}

    public record QnaTeammateAnswerDto(
            UUID userId,
            String userName,
            String handle,
            String ownAnswer,
            Instant updatedAt
    ) {}

    public record QnaItemDto(
            UUID id,
            String hash,
            String kind,
            String category,
            String criterion,
            String question,
            String answer,
            String followup,
            String counter,
            String proof,
            UUID ownerUserId,
            String ownerHandle,
            String source,
            int myMastery,
            int teamMastery,
            String myOwnAnswer,
            boolean myShared,
            List<QnaTeammateAnswerDto> sharedAnswers,
            int position
    ) {}

    public record QnaCriterionLaneDto(
            String criterion,
            int weight,
            int total,
            int solid,
            int shaky,
            int missed,
            int unseen
    ) {}

    public record QnaTeamMemberProgressDto(
            UUID userId,
            String userName,
            String userHandle,
            int practisedCount,
            int solidCount,
            int weakestOwnedCount
    ) {}

    public record QnaMapResponse(
            int totalQuestions,
            int solidQuestions,
            int solidPercent,
            String weakestCriterion,
            int weakestSolidCount,
            int weakestTotalCount,
            List<QnaCriterionLaneDto> lanes,
            List<QnaTeamMemberProgressDto> teamMembers,
            String weakestOwnerHandle,
            int weakestOwnerCount
    ) {}

    public record UpdateMyAnswerRequest(
            String ownAnswer,
            Boolean shared
    ) {}

    public record UpdateMasteryRequest(
            Integer level // 0..3
    ) {}

    public record CreateCustomQuestionRequest(
            String kind,
            String category,
            String criterion,
            String question,
            String answer,
            String followup,
            String counter,
            String proof,
            UUID ownerUserId,
            String ownerHandle
    ) {}

    public record PatchCustomQuestionRequest(
            String kind,
            String category,
            String criterion,
            String question,
            String answer,
            String followup,
            String counter,
            String proof,
            UUID ownerUserId,
            String ownerHandle
    ) {}

    public record StartSessionRequest(
            Integer size, // 5 | 10 | 20
            String focus, // ALL | WEAKEST | WEIGHTED | MINE | CRITERION
            String criterion,
            Boolean pressure,
            String answerMode, // THINK | SPEAK | TYPE
            Integer timerSec, // 0 | 30 | 45 | 60
            String persona // SKEPTICAL_ENGINEER | BUSINESS | DOMAIN_EXPERT | FRIENDLY_MENTOR
    ) {}

    public record StartSessionResponse(
            UUID id,
            List<QnaItemDto> questions,
            Map<String, Object> config
    ) {}

    public record SubmitSessionAnswerRequest(
            String hash,
            Integer rating, // 1..3
            String answerText,
            Long durationMs,
            Boolean followupShown,
            List<String> coveredPoints
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SessionSummaryDto(
            Map<String, Integer> counts, // { "solid": 5, "shaky": 2, "missed": 1 }
            long avgAnswerMs,
            Long longestHesitation,
            String weakestCriterion,
            List<String> revisit
    ) {}

    public record AiGradeRequest(
            String hash,
            String answerText
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AiGradeResponse(
            int score, // 0..10
            String verdict,
            List<String> missed,
            String better
    ) {}

    public record AiGenerateMoreRequest(
            String criterion,
            String persona,
            Integer count
    ) {}
}
