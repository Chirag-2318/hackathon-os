package com.hackathonos.backend.invites.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JoinCodeRequest(
        @NotBlank(message = "Join code is required")
        @Size(min = 4, max = 4, message = "Join code must be 4 characters")
        String code
) {}
