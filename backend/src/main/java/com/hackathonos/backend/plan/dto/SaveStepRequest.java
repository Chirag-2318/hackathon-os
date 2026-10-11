package com.hackathonos.backend.plan.dto;

public record SaveStepRequest(
        String answer,
        boolean confirmClear
) {}
