package com.hackathonos.backend.plan.dto;

import java.util.Collections;
import java.util.List;

public record ValidatePlanResponse(
        boolean ok,
        boolean needsConfirmation,
        List<ValidatedFileDto> files,
        List<ValidationIssueDto> issues,
        String repairPrompt,
        Boolean valid,
        List<String> errors,
        List<String> warnings,
        String summary,
        String nextStepKey,
        Boolean planComplete,
        PlanCompletionSummaryDto completion,
        ValidationDiagnosticsDto diagnostics,
        Boolean validatedWithOverrides
) {
    public ValidatePlanResponse(
            boolean ok,
            boolean needsConfirmation,
            List<ValidatedFileDto> files,
            List<ValidationIssueDto> issues,
            String repairPrompt,
            String nextStepKey,
            boolean planComplete,
            PlanCompletionSummaryDto completion
    ) {
        this(
                ok,
                needsConfirmation,
                files != null ? files : Collections.emptyList(),
                issues != null ? issues : Collections.emptyList(),
                repairPrompt,
                ok,
                issues != null ? issues.stream().filter(i -> "BLOCK".equalsIgnoreCase(i.severity())).map(ValidationIssueDto::message).toList() : Collections.emptyList(),
                issues != null ? issues.stream().filter(i -> "WARN".equalsIgnoreCase(i.severity())).map(ValidationIssueDto::message).toList() : Collections.emptyList(),
                ok ? "Validation succeeded" : "Validation failed",
                nextStepKey,
                planComplete,
                completion,
                null,
                false
        );
    }

    public ValidatePlanResponse(
            boolean ok,
            boolean needsConfirmation,
            List<ValidatedFileDto> files,
            List<ValidationIssueDto> issues,
            String repairPrompt,
            String nextStepKey,
            boolean planComplete,
            PlanCompletionSummaryDto completion,
            ValidationDiagnosticsDto diagnostics,
            boolean validatedWithOverrides
    ) {
        this(
                ok,
                needsConfirmation,
                files != null ? files : Collections.emptyList(),
                issues != null ? issues : Collections.emptyList(),
                repairPrompt,
                ok,
                issues != null ? issues.stream().filter(i -> "BLOCK".equalsIgnoreCase(i.severity())).map(ValidationIssueDto::message).toList() : Collections.emptyList(),
                issues != null ? issues.stream().filter(i -> "WARN".equalsIgnoreCase(i.severity())).map(ValidationIssueDto::message).toList() : Collections.emptyList(),
                ok ? "Validation succeeded" : "Validation failed",
                nextStepKey,
                planComplete,
                completion,
                diagnostics,
                validatedWithOverrides
        );
    }

    public ValidatePlanResponse(
            boolean valid,
            List<String> errors,
            List<String> warnings,
            String summary,
            String repairPrompt,
            String nextStepKey,
            boolean planComplete,
            PlanCompletionSummaryDto completion
    ) {
        this(
                valid,
                false,
                Collections.emptyList(),
                Collections.emptyList(),
                repairPrompt,
                valid,
                errors != null ? errors : Collections.emptyList(),
                warnings != null ? warnings : Collections.emptyList(),
                summary,
                nextStepKey,
                planComplete,
                completion,
                null,
                false
        );
    }
}
