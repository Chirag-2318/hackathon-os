package com.hackathonos.backend.plan.dto;

public record PlanPermissionsDto(
        boolean canEdit,
        boolean canEnterBuild,
        boolean isLeader
) {
    public PlanPermissionsDto(boolean canEdit, boolean canEnterBuild) {
        this(canEdit, canEnterBuild, true);
    }
}
