package com.hackathonos.backend.brief.dto;

import java.util.List;

public record BriefFieldsDto(
        String problemStatement,
        String targetAudience,
        List<RubricCriterionDto> rubric,
        DeadlinesDto deadlines,
        String eligibility,
        String techRules,
        String aiPolicy,
        List<String> deliverables,
        List<String> tracksAndPrizes,
        String judgingFormat,
        List<String> risks
) {}
