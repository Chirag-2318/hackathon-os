package com.hackathonos.backend.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record HotspotRequest(
        @NotBlank(message = "key is required")
        @Size(max = 40, message = "key length must be at most 40 characters")
        @Pattern(regexp = "^[a-z0-9_-]+$", message = "key must match [a-z0-9_-]")
        String key
) {}
