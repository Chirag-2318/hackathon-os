package com.hackathonos.backend.brief.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExtractBriefRequest(
        @NotBlank(message = "Text cannot be blank")
        @Size(max = 20000, message = "Text cannot exceed 20,000 characters")
        String text
) {}
