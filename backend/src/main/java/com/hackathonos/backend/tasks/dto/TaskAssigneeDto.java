package com.hackathonos.backend.tasks.dto;

public record TaskAssigneeDto(
        String userId,
        String name,
        String avatarUrl
) {}
