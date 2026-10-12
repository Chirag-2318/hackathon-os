package com.hackathonos.backend.brief.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TextSourceRequest(
        @NotBlank(message = "Text cannot be blank")
        @Size(min = 50, max = 200000, message = "Text must be between 50 and 200000 characters")
        String text
) {}
