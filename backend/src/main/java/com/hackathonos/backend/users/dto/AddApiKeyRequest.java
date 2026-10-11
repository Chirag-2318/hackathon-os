package com.hackathonos.backend.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddApiKeyRequest(
        @NotBlank(message = "Provider is required")
        String provider,

        @NotBlank(message = "Label is required")
        @Size(max = 100, message = "Label must be 100 chars or fewer")
        String label,

        @NotBlank(message = "Key is required")
        String key
) {}
