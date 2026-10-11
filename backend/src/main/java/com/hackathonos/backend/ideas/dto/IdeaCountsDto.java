package com.hackathonos.backend.ideas.dto;

public record IdeaCountsDto(
        long all,
        long pending,
        long approved,
        long rejected
) {}
