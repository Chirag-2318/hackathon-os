package com.hackathonos.backend.tasks.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MoveTaskRequest(
        @NotBlank String toStatus,
        @NotNull Integer toIndex
) {}
