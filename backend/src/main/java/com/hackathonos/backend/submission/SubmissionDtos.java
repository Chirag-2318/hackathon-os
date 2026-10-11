package com.hackathonos.backend.submission;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class SubmissionDtos {

    public record DeadlineInfoDto(
            Instant at,
            long hoursLeft,
            String status // "ON_TRACK", "URGENT", "PASSED"
    ) {}

    public record FormFieldDto(
            String key,
            String label,
            String value,
            boolean required
    ) {}

    public record SubmissionDraftDto(
            String whatItDoes,
            String whyItMatters,
            String howBuilt,
            String howWeBuiltIt,
            String challenges,
            String whatsNext
    ) {}

    public record ChecklistItemDto(
            String id,
            String key,
            String label,
            boolean done,
            boolean required,
            boolean auto,
            String route,
            String group,
            String category
    ) {}

    public record SubmissionLinkDto(
            UUID id,
            String label,
            String url,
            Boolean ok,
            Integer httpStatus,
            Instant lastCheckedAt
    ) {}

    public record LinkCheckRowDto(
            String url,
            String status, // "verified", "failing", "unknown"
            String fixTarget
    ) {}

    public record JudgeViewDto(
            int wordCount,
            int readingSeconds,
            List<String> missingSections,
            String preview
    ) {}

    public record SubmissionResponse(
            String status, // "draft", "verified", "submitted"
            DeadlineInfoDto deadline,
            List<String> requirements,
            List<FormFieldDto> formFields,
            SubmissionDraftDto draft,
            List<ChecklistItemDto> checklist,
            List<ChecklistItemDto> items,
            List<SubmissionLinkDto> links,
            List<LinkCheckRowDto> linkCheck,
            JudgeViewDto judgeView,
            boolean canVerify,
            List<String> blockers,
            boolean lateEdit,
            Instant serverNow
    ) {}

    public record UpdateDraftRequest(
            String whatItDoes,
            String whyItMatters,
            String howBuilt,
            String howWeBuiltIt,
            String challenges,
            String whatsNext
    ) {
        public String getEffectiveHowBuilt() {
            if (howBuilt != null) return howBuilt;
            if (howWeBuiltIt != null) return howWeBuiltIt;
            return "";
        }
    }

    public record GenerateDraftRequest(
            Boolean useAi
    ) {}

    public record UpdateFormFieldsRequest(
            List<FormFieldDto> fields
    ) {}

    public record ToggleChecklistRequest(
            Boolean done
    ) {}

    public record CreateLinkRequest(
            String label,
            String url
    ) {}

    public record UpdateLinkRequest(
            String label,
            String url
    ) {}

    public record VerifyResultDto(
            boolean verified,
            List<String> blockers
    ) {}
}
