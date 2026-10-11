package com.hackathonos.backend.home;

import com.hackathonos.backend.checkpoints.dto.CheckpointDtos.CheckpointItemDto;
import com.hackathonos.backend.overview.ClockService;
import com.hackathonos.backend.overview.WorkloadService;
import com.hackathonos.backend.overview.dto.OverviewDtos.*;
import com.hackathonos.backend.tasks.dto.TaskDto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class HomeDtos {

    public record HomeUserDto(
            String firstName,
            String timezone
    ) {}

    public record HomeRoomCardDto(
            UUID id,
            String name,
            String type,
            String stage,
            String phaseLabel,
            NextDeadlineDto nextDeadline,
            long checkpointsPassed,
            long checkpointsTotal,
            int journeyDone,
            int journeyTotal,
            long myOpenTasks,
            boolean isSelected
    ) {}

    public record NextDeadlineDto(
            String label,
            Instant dueAt
    ) {}

    public record SelectedDeadlineRowDto(
            String title,
            String helper,
            String tag,
            Instant dueAt,
            boolean done
    ) {}

    public record HomeMyTasksDto(
            List<TaskDto> items,
            long openCount
    ) {}

    public record HomePlanningDataDto(
            Object journey,
            String brief,
            PlanningIdeasDto ideas
    ) {}

    public record SelectedRoomDto(
            UUID roomId,
            String name,
            String variant,
            String headline,
            ClockService.ClockStatusDto clock,
            List<ClockService.TimelineSegmentDto> timeline,
            CheckpointItemDto nextCheckpoint,
            List<SelectedDeadlineRowDto> deadlines,
            HomeMyTasksDto myTasks,
            List<WorkloadService.MemberWorkloadDto> workload,
            OverviewTeamDto team,
            HomePlanningDataDto planning
    ) {}

    public record HomeResponseDto(
            HomeUserDto user,
            Instant serverNow,
            List<HomeRoomCardDto> rooms,
            SelectedRoomDto selected
    ) {}
}
