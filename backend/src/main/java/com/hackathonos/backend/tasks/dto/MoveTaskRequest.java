package com.hackathonos.backend.tasks.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record MoveTaskRequest(
        @NotBlank String toStatus,
        @JsonAlias("targetIndex") Integer toIndex
) {
    public MoveTaskRequest {
        if (toIndex == null) {
            toIndex = 0;
        }
    }
}
