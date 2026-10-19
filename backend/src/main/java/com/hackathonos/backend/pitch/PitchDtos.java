package com.hackathonos.backend.pitch;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class PitchDtos {

    // ── DECK SOURCE ──────────────────────────────────────────────────
    public record PitchDeckSourceDto(
            UUID roomId,
            String provider,
            String url,
            String title,
            String filePath,
            String thumbnailUrl,
            String embedUrl,
            UUID updatedBy,
            Instant updatedAt
    ) {}

    public record SaveDeckSourceRequest(
            String provider,
            String url,
            String title
    ) {}

    // ── PITCH SCRIPT ─────────────────────────────────────────────────
    public record PitchSpeakerDto(
            int index,
            UUID userId,
            String name,
            String role
    ) {}

    public record PitchSlidePlanDto(
            int n,
            String headline,
            int speakerIndex,
            int seconds,
            String say,
            String show,
            String cue,
            List<String> keyPoints
    ) {}

    public record PitchScriptDto(
            UUID roomId,
            String type,
            int speakerCount,
            List<PitchSpeakerDto> speakers,
            String instructions,
            String hook,
            String closingLine,
            int totalSeconds,
            List<PitchSlidePlanDto> slides,
            UUID generatedBy,
            Instant generatedAt,
            String source,
            Integer docVersion
    ) {
        public PitchScriptDto(UUID roomId, String type, int speakerCount, List<PitchSpeakerDto> speakers,
                              String instructions, String hook, String closingLine, int totalSeconds,
                              List<PitchSlidePlanDto> slides, UUID generatedBy, Instant generatedAt) {
            this(roomId, type, speakerCount, speakers, instructions, hook, closingLine, totalSeconds, slides, generatedBy, generatedAt, "GENERATED", 1);
        }
    }

    public record GeneratePitchScriptRequest(
            String type,
            int speakerCount,
            List<UUID> speakerUserIds,
            String instructions
    ) {}

    public record UpdatePitchSlidePlanRequest(
            String say,
            String show,
            Long version
    ) {
        public UpdatePitchSlidePlanRequest(String say, String show) {
            this(say, show, null);
        }
    }

    // ── DECK & SLIDES ────────────────────────────────────────────────
    public record FormatProfileDto(
            String kind,
            String label,
            int targetSeconds,
            int maxSlides,
            boolean auto
    ) {}

    public record SlideDto(
            UUID id,
            int position,
            int order,
            String kind,
            String title,
            String question,
            String guide,
            String content,
            int wordCount,
            List<String> covers
    ) {}

    public record CriterionCoverageDto(
            String criterion,
            int weight,
            int slideCount
    ) {}

    public record DeckCoverageSummaryDto(
            List<CriterionCoverageDto> criteria,
            List<String> gaps
    ) {}

    public record PitchDeckResponse(
            FormatProfileDto format,
            List<SlideDto> slides,
            DeckCoverageSummaryDto coverageSummary,
            Map<String, List<String>> coverage,
            List<SlideLinter.LintIssue> lint,
            Instant serverNow
    ) {}

    public record UpdateFormatRequest(String kind) {}
    public record CreateSlideRequest(String kind, String title, String question, String content) {}
    public record UpdateSlideRequest(String kind, String title, String question, String content) {}
    public record ReorderSlidesRequest(List<UUID> slideIds) {}
    public record UpdateCoverageRequest(List<String> criteria) {}
    public record DraftSlideResponse(String content) {}

    // ── REHEARSE ─────────────────────────────────────────────────────
    public record SectionPaceDto(
            String label,
            int targetSec,
            int actualSec
    ) {}

    public record RehearsalRunDto(
            UUID id,
            Instant runAt,
            int durationSec,
            int durationSeconds,
            UserSummaryDto presenter,
            UserSummaryDto operator,
            List<SectionPaceDto> sectionPaces,
            String notes,
            Object stats
    ) {}

    public record UserSummaryDto(
            UUID id,
            String name,
            String avatarUrl
    ) {}

    public record RoleAssignmentDto(
            String role,
            String memberId,
            String name
    ) {}

    public record PitchRolesDto(
            UserSummaryDto presenter,
            UserSummaryDto operator
    ) {}

    public record DemoSectionOutlineDto(
            String label,
            int targetSec
    ) {}

    public record RehearseResponse(
            List<RehearsalRunDto> runs,
            long count,
            int target,
            RehearsalRunDto best,
            PitchRolesDto roles,
            List<RoleAssignmentDto> roleList,
            int targetSeconds,
            List<DemoSectionOutlineDto> sections
    ) {}

    public record CreateRunRequest(
            Integer durationSec,
            Integer durationSeconds,
            Object sectionPaces,
            String notes,
            Object stats
    ) {
        public int getEffectiveDurationSec() {
            if (durationSec != null) return durationSec;
            if (durationSeconds != null) return durationSeconds;
            return 0;
        }
    }

    public record UpdateRolesRequest(
            UUID presenterId,
            UUID operatorId
    ) {}

    // ── Q&A ──────────────────────────────────────────────────────────
    public record QaItemDto(
            UUID id,
            String question,
            String text,
            String answer,
            String category,
            String source,
            boolean practiced,
            String status,
            UserSummaryDto owner,
            String whyAsked,
            String riskPoint,
            Integer difficulty
    ) {}

    public record CodeDefenseDto(
            UUID id,
            String module,
            String question,
            UserSummaryDto owner,
            Instant practicedAt
    ) {}

    public record RequiredQuestionDto(
            String text,
            boolean present
    ) {}

    public record QaResponse(
            List<QaItemDto> items,
            List<QaItemDto> questions,
            List<CodeDefenseDto> codeDefense,
            List<RequiredQuestionDto> requiredQuestions
    ) {}

    public record CreateQaRequest(
            String question,
            String answer,
            String category,
            UUID ownerId,
            String whyAsked,
            String riskPoint,
            Integer difficulty
    ) {}

    public record UpdateQaRequest(
            String question,
            String answer,
            String category,
            UUID ownerId,
            String whyAsked,
            String riskPoint,
            Integer difficulty
    ) {}

    public record TogglePracticedRequest(
            Boolean practiced
    ) {}

    public record CreateCodeDefenseRequest(
            String module,
            String question,
            UUID ownerId
    ) {}

    public record GenerateQaRequest(
            String level,
            Integer count
    ) {}

    public record GeneratedQaProposalDto(
            String question,
            String answer,
            String category,
            String whyAsked,
            String riskPoint,
            Integer difficulty
    ) {}

    public record GenerateQaResponse(
            List<GeneratedQaProposalDto> proposals
    ) {}
}
