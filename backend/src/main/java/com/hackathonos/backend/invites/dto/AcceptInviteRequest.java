package com.hackathonos.backend.invites.dto;

import jakarta.validation.constraints.NotBlank;

public record AcceptInviteRequest(
        @NotBlank(message = "Token is required")
        String token
) {}
