package com.hackathonos.backend.plan.dto;

import java.util.List;

public record PlanDto(
        List<PlanStepDto> steps,
        ContextPackDto contextPack,
        PlanCompletionSummaryDto completion,
        boolean planLocked,
        boolean canEnterBuild,
        PlanPermissionsDto permissions
) {}
