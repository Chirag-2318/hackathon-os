package com.hackathonos.backend.plan.dto;

import java.util.List;

public record PlanContextSummaryDto(
        String statementPreview,
        String briefStatement,
        boolean briefConfirmed,
        Integer eventHours,
        List<ApprovedIdeaSummaryDto> approvedIdeas,
        List<String> teamSkills,
        List<String> memberSkills
) {
    public PlanContextSummaryDto(String statementPreview, List<ApprovedIdeaSummaryDto> approvedIdeas, List<String> teamSkills) {
        this(statementPreview, statementPreview, true, 36, approvedIdeas, teamSkills, teamSkills);
    }
}
