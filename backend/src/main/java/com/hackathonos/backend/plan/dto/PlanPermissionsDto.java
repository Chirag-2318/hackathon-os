package com.hackathonos.backend.plan.dto;

public record PlanPermissionsDto(
        boolean canEdit,
        boolean canEnterBuild
) {}
