package com.hackathonos.backend.tasks.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateAcceptanceRequest(
        @NotBlank String text
) {}
