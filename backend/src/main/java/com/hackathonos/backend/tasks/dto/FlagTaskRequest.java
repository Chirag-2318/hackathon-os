package com.hackathonos.backend.tasks.dto;

import jakarta.validation.constraints.Size;

public record FlagTaskRequest(
        boolean flagged,
        @Size(max = 200) String reason
) {}
