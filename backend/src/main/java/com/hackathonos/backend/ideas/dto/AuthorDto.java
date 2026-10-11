package com.hackathonos.backend.ideas.dto;

public record AuthorDto(
        String userId,
        String name,
        String initials,
        String avatarUrl
) {}
