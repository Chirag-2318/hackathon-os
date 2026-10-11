package com.hackathonos.backend.tasks.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCommentRequest(
        @NotBlank @Size(min = 1, max = 2000) String text
) {}
