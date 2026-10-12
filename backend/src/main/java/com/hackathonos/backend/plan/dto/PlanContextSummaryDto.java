package com.hackathonos.backend.plan.dto;

import java.util.List;

public record PlanContextSummaryDto(
        String statementPreview,
        List<ApprovedIdeaSummaryDto> approvedIdeas,
        List<String> teamSkills
) {}
