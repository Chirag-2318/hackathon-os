package com.hackathonos.backend.tasks.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSubtaskRequest(
        @NotBlank String text
) {}
