package com.hackathonos.backend.rooms.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RoomDetailDto(
        UUID id,
        String name,
        String description,
        String projectDescription,
        String templateId,
        String templateName,
        String stage,
        Instant eventStart,
        Instant eventEnd,
        String timezone,
        UUID ownerId,
        long memberCount,
        String myRole,
        boolean isLeader,
        String joinCode,
        String keyPrefix,
        StageDone stageDone,
        Instant buildStartedAt,
        boolean archived,
        Instant serverNow,
        Instant createdAt,
        RoomClockDto clock,
        boolean aiAllowed,
        RoomProgressSummaryDto progressSummary,
        List<StageUnlockRuleDto> unlockRules,
        String workflowStage,
        NextStepDto nextStep,
        List<com.hackathonos.backend.phases.dto.PhaseSummaryDto> phases,
        Long version
) {
    public record StageDone(boolean brief, boolean ideate, boolean plan) {}

    public RoomDetailDto(
            UUID id,
            String name,
            String description,
            String projectDescription,
            String templateId,
            String templateName,
            String stage,
            Instant eventStart,
            Instant eventEnd,
            String timezone,
            UUID ownerId,
            long memberCount,
            String myRole,
            boolean isLeader,
            String joinCode,
            String keyPrefix,
            StageDone stageDone,
            Instant buildStartedAt,
            boolean archived,
            Instant serverNow,
            Instant createdAt,
            RoomClockDto clock,
            boolean aiAllowed,
            RoomProgressSummaryDto progressSummary,
            List<StageUnlockRuleDto> unlockRules,
            String workflowStage,
            NextStepDto nextStep,
            List<com.hackathonos.backend.phases.dto.PhaseSummaryDto> phases
    ) {
        this(id, name, description, projectDescription, templateId, templateName, stage, eventStart, eventEnd,
                timezone, ownerId, memberCount, myRole, isLeader, joinCode, keyPrefix, stageDone, buildStartedAt,
                archived, serverNow, createdAt, clock, aiAllowed, progressSummary, unlockRules, workflowStage,
                nextStep, phases, 0L);
    }
}
