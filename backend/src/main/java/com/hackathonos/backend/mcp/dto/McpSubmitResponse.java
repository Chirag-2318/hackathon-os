package com.hackathonos.backend.mcp.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hackathonos.backend.plan.dto.PlanCompletionSummaryDto;
import com.hackathonos.backend.plan.dto.ValidatePlanResponse;
import com.hackathonos.backend.plan.dto.ValidatedFileDto;
import com.hackathonos.backend.plan.dto.ValidationDiagnosticsDto;
import com.hackathonos.backend.plan.dto.ValidationIssueDto;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record McpSubmitResponse(
        boolean ok,
        Boolean valid,
        List<ValidationIssueDto> issues,
        List<String> errors,
        List<String> warnings,
        String repairPrompt,
        boolean needsConfirmation,
        List<ValidatedFileDto> files,
        String summary,
        String nextStepKey,
        Boolean planComplete,
        PlanCompletionSummaryDto completion,
        ValidationDiagnosticsDto diagnostics,
        Boolean validatedWithOverrides,
        String webUrl
) {
    public McpSubmitResponse(ValidatePlanResponse response, String webUrl) {
        this(
                response.ok(),
                response.valid(),
                response.issues(),
                response.errors(),
                response.warnings(),
                response.repairPrompt(),
                response.needsConfirmation(),
                response.files(),
                response.summary(),
                response.nextStepKey(),
                response.planComplete(),
                response.completion(),
                response.diagnostics(),
                response.validatedWithOverrides(),
                webUrl
        );
    }
}
