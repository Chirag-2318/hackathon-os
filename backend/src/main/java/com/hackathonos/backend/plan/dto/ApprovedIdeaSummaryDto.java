package com.hackathonos.backend.plan.dto;

import java.util.UUID;

public record ApprovedIdeaSummaryDto(
        UUID id,
        String text,
        String authorName,
        boolean primary
) {}
