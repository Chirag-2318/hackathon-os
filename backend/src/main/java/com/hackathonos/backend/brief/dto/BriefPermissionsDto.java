package com.hackathonos.backend.brief.dto;

public record BriefPermissionsDto(
        boolean canEdit,
        boolean canConfirm
) {}
