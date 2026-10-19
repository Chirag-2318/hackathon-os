package com.hackathonos.backend.phases.dto;

import com.hackathonos.backend.plan.dto.ValidationDiagnosticsDto;
import com.hackathonos.backend.plan.dto.ValidationIssueDto;
import java.util.List;
import java.util.Map;

public record PhaseTaskImportSummaryDto(
        boolean ok,
        boolean needsConfirmation,
        List<ValidationIssueDto> issues,
        int tasksCreated,
        double totalHours,
        int teamMemberCount,
        Map<String, Double> memberHours,
        List<String> uncoveredRequirements,
        String nextPhaseKey,
        ValidationDiagnosticsDto diagnostics,
        String requestId
) {
    public PhaseTaskImportSummaryDto(
            boolean ok,
            boolean needsConfirmation,
            List<ValidationIssueDto> issues,
            int tasksCreated,
            double totalHours,
            int teamMemberCount,
            Map<String, Double> memberHours,
            List<String> uncoveredRequirements,
            String nextPhaseKey
    ) {
        this(ok, needsConfirmation, issues, tasksCreated, totalHours, teamMemberCount, memberHours, uncoveredRequirements, nextPhaseKey, null, null);
    }
}

