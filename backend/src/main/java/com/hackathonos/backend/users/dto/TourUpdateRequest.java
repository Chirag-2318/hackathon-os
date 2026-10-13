package com.hackathonos.backend.users.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record TourUpdateRequest(
        @NotNull(message = "status is required")
        @Pattern(regexp = "^(SKIPPED|COMPLETED)$", message = "status must be SKIPPED or COMPLETED")
        String status,

        @Pattern(regexp = "^(LEADER|MEMBER)$", message = "path must be LEADER or MEMBER")
        String path,

        Integer version
) {}
