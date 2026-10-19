package com.hackathonos.backend.pitch;

import java.util.List;

public class DeckAuditDtos {

    public record DeckSlideSummaryDto(
            int pageNo,
            String title,
            int chars,
            String auditVerdict // GOOD, OK, WEAK, or null if not audited
    ) {}

    public record DeckSlidesResponse(
            List<DeckSlideSummaryDto> slides,
            String deckHash,
            boolean isDeckAudited,
            boolean isStale
    ) {}

    public record SaveSlideTextRequest(String text) {}

    public record AuditRequest(Integer page) {}

    public record SlideIssueDto(String severity, String text) {}

    public record SlideAuditResponse(
            int pageNo,
            String role,
            String verdict, // GOOD, OK, WEAK
            List<SlideIssueDto> issues,
            List<String> fixes,
            List<String> rubric,
            List<String> missing,
            boolean stale
    ) {}

    public record RubricCoverageItemDto(
            String criterion,
            int weight,
            String level, // NONE, THIN, GOOD
            List<Integer> pages
    ) {}

    public record DeckAuditResponse(
            String narrative,
            List<String> missingSlides,
            List<RubricCoverageItemDto> coverage,
            String timingNote,
            boolean stale
    ) {}
}
