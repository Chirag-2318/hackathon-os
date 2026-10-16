package com.hackathonos.backend.plan.dto;

import java.util.List;
import java.util.Map;

public record PlanPrepareStatusDto(
        String jobId,
        String status,
        String startedAt,
        List<PrepareStageDto> stages,
        Map<String, Object> facts,
        String mode,
        String verdict,
        String analysisState
) {
    public PlanPrepareStatusDto(
            String jobId,
            String status,
            String startedAt,
            List<PrepareStageDto> stages,
            Map<String, Object> facts
    ) {
        this(jobId, status, startedAt, stages, facts, null, null, "READY");
    }
}
