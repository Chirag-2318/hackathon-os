package com.hackathonos.backend.ai.dto;

import java.time.Instant;

public record UserAiKeyResponseDto(
        boolean hasKey,
        String last4,
        String status,
        Instant lastCheckedAt,
        String host
) {}
