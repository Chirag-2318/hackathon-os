package com.hackathonos.backend.users.dto;

import java.time.Instant;
import java.util.UUID;

public record ApiKeyDto(
        UUID id,
        String provider,
        String label,
        String last4,
        Instant createdAt
) {}
