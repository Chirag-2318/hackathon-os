package com.hackathonos.backend.plan.dto;

public record ValidatePlanRequest(
        String stepKey,
        String answer,
        Boolean confirmWarnings,
        Boolean override
) {
    public ValidatePlanRequest(String stepKey, String answer) {
        this(stepKey, answer, false, false);
    }

    public ValidatePlanRequest(String stepKey, String answer, Boolean confirmWarnings) {
        this(stepKey, answer, confirmWarnings, false);
    }
}
