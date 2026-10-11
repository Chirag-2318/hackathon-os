package com.hackathonos.backend.plan.dto;

import java.util.List;

public record ValidatePlanResponse(
        boolean valid,
        List<String> errors,
        List<String> warnings,
        String summary,
        String repairPrompt,
        String nextStepKey,
        boolean planComplete,
        PlanCompletionSummaryDto completion
) {}
