package com.hackathonos.backend.ideas.dto;

public record ContributorDto(
        String userId,
        String name,
        String avatarUrl,
        long ideaCount
) {}
