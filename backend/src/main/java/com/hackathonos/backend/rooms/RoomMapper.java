package com.hackathonos.backend.rooms;

import com.hackathonos.backend.rooms.dto.RoomClockDto;
import com.hackathonos.backend.rooms.dto.RoomDetailDto;
import com.hackathonos.backend.rooms.dto.RoomProgressSummaryDto;
import com.hackathonos.backend.rooms.dto.StageUnlockRuleDto;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class RoomMapper {

    public RoomDetailDto toDetail(
            Room room,
            String templateName,
            long memberCount,
            String myRole,
            boolean isLeader,
            RoomClockDto clock,
            boolean aiAllowed,
            RoomProgressSummaryDto progressSummary,
            List<StageUnlockRuleDto> unlockRules,
            com.hackathonos.backend.rooms.dto.NextStepDto nextStep,
            List<com.hackathonos.backend.phases.dto.PhaseSummaryDto> phases
    ) {
        RoomDetailDto.StageDone stageDone = new RoomDetailDto.StageDone(
                room.isBriefDone(),
                room.isIdeateDone(),
                room.isPlanDone()
        );

        String visibleJoinCode = room.getJoinCode();
        Instant now = clock != null && clock.serverNow() != null ? clock.serverNow() : Instant.now();

        return new RoomDetailDto(
                room.getId(),
                room.getName(),
                room.getDescription(),
                room.getProjectDescription(),
                room.getTemplateId(),
                templateName,
                room.getStage(),
                room.getEventStart(),
                room.getEventEnd(),
                room.getTimezone(),
                room.getOwnerId(),
                memberCount,
                myRole,
                isLeader,
                visibleJoinCode,
                room.getKeyPrefix(),
                stageDone,
                room.getBuildStartedAt(),
                room.getArchivedAt() != null,
                now,
                room.getCreatedAt(),
                clock,
                aiAllowed,
                progressSummary,
                unlockRules != null ? unlockRules : List.of(),
                room.getWorkflowStage(),
                nextStep != null ? nextStep : new com.hackathonos.backend.rooms.dto.NextStepDto("Continue setup", "/app/rooms/" + room.getId(), "Work on project"),
                phases != null ? phases : List.of()
        );
    }

    public RoomDetailDto toDetail(
            Room room,
            String templateName,
            long memberCount,
            String myRole,
            boolean isLeader,
            RoomClockDto clock,
            boolean aiAllowed,
            RoomProgressSummaryDto progressSummary,
            List<StageUnlockRuleDto> unlockRules,
            com.hackathonos.backend.rooms.dto.NextStepDto nextStep
    ) {
        return toDetail(room, templateName, memberCount, myRole, isLeader, clock, aiAllowed, progressSummary, unlockRules, nextStep, List.of());
    }

    public RoomDetailDto toDetail(Room room, String templateName, long memberCount, String myRole, boolean isLeader) {
        RoomClockDto dummyClock = new RoomClockDto(
                "UPCOMING",
                Instant.now(),
                room.getStartsAt() != null ? room.getStartsAt() : Instant.now(),
                room.getFreezeAt() != null ? room.getFreezeAt() : Instant.now(),
                room.getEndsAt() != null ? room.getEndsAt() : Instant.now(),
                0.0,
                0,
                room.getDurationHours() > 0 ? room.getDurationHours() : 36,
                0,
                0,
                0
        );
        RoomProgressSummaryDto dummyProgress = new RoomProgressSummaryDto(0, 0, false, 0, 5, 0, 0);
        return toDetail(room, templateName, memberCount, myRole, isLeader, dummyClock, true, dummyProgress, List.of(), null);
    }
}

