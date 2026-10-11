package com.hackathonos.backend.rooms;

import com.hackathonos.backend.rooms.dto.RoomDetailDto;
import com.hackathonos.backend.rooms.dto.RoomListItemDto;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class RoomMapper {

    public RoomDetailDto toDetail(Room room, String templateName, long memberCount, String myRole, boolean isLeader) {
        RoomDetailDto.StageDone stageDone = new RoomDetailDto.StageDone(
                room.isBriefDone(),
                room.isIdeateDone(),
                room.isPlanDone()
        );

        String visibleJoinCode = isLeader ? room.getJoinCode() : null;

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
                Instant.now(),
                room.getCreatedAt()
        );
    }

    public RoomListItemDto toListItem(Room room, String templateName, long memberCount, String myRole, boolean isLeader) {
        int doneCount = (room.isBriefDone() ? 1 : 0) +
                (room.isIdeateDone() ? 1 : 0) +
                (room.isPlanDone() ? 1 : 0) +
                (room.getBuildStartedAt() != null ? 1 : 0);

        return new RoomListItemDto(
                room.getId(),
                room.getName(),
                room.getDescription(),
                room.getTemplateId(),
                templateName,
                room.getStage(),
                room.getEventStart(),
                room.getEventEnd(),
                memberCount,
                myRole,
                isLeader,
                new RoomListItemDto.JourneyProgress(doneCount, 4),
                room.getCreatedAt()
        );
    }
}
