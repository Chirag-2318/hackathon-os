package com.hackathonos.backend.members.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateInvitationRequest(
        @NotBlank(message = "Invitee email or name is required")
        String inviteeText,
        String role
) {}
