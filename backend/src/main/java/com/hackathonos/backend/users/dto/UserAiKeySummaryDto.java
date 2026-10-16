package com.hackathonos.backend.users.dto;

public record UserAiKeySummaryDto(
        boolean hasKey,
        String status,
        String last4
) {}
