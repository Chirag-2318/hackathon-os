package com.hackathonos.backend.invites.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InviteEmailRequest(
        @NotBlank(message = "Email is required")
        @Size(max = 254, message = "Email cannot exceed 254 characters")
        @Email(message = "Invalid email format")
        String email,

        @Size(max = 140, message = "Note cannot exceed 140 characters")
        String note,

        String role
) {}
