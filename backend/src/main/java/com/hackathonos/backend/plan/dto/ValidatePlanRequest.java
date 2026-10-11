package com.hackathonos.backend.plan.dto;

public record ValidatePlanRequest(
        String stepKey,
        String answer
) {}
