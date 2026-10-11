package com.hackathonos.backend.ideas.dto;

public record IdeatePermissionsDto(
        boolean canPost,
        boolean canDecide,
        boolean canFinish,
        boolean canReopen
) {}
