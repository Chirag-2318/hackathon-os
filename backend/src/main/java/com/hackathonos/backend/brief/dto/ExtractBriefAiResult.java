package com.hackathonos.backend.brief.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ExtractBriefAiResult(
        String problemStatement,
        String targetAudience,
        List<RubricItem> rubric,
        List<DeadlineItem> deadlines,
        List<String> rules,
        Object allowedTech,
        Object forbiddenTech,
        String aiUsePolicy,
        List<String> deliverables,
        List<String> tracks,
        String judgingFormat
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RubricItem(String name, String criterion, Integer weight) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DeadlineItem(String label, String dateTime) {}
}
