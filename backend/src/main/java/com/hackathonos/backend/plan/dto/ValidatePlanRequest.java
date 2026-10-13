package com.hackathonos.backend.plan.dto;

public record ValidatePlanRequest(
        String stepKey,
        String answer,
        Boolean confirmWarnings
) {
    public ValidatePlanRequest(String stepKey, String answer) {
        this(stepKey, answer, false);
    }
}
