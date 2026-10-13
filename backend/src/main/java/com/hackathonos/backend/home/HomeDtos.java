package com.hackathonos.backend.home;

import com.hackathonos.backend.checkpoints.dto.CheckpointDtos.CheckpointItemDto;
import com.hackathonos.backend.overview.ClockService;
import com.hackathonos.backend.overview.WorkloadService;
import com.hackathonos.backend.overview.dto.OverviewDtos.*;
import com.hackathonos.backend.rooms.dto.NextStepDto;
import com.hackathonos.backend.rooms.dto.RoomClockDto;
import com.hackathonos.backend.tasks.dto.TaskDto;
import com.hackathonos.backend.users.dto.UserSummaryDto;

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
            boolean isSelected,
            RoomClockDto clock,
            NextStepDto nextStep
    ) {
        public HomeRoomCardDto(
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
                boolean isSelected,
                RoomClockDto clock
        ) {
            this(id, name, type, stage, phaseLabel, nextDeadline, checkpointsPassed, checkpointsTotal,
                    journeyDone, journeyTotal, myOpenTasks, isSelected, clock, null);
        }
    }

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
            HomePlanningDataDto planning,
            RoomClockDto roomClock
    ) {}

    public record DailyActivityDto(
            String date,
            int count
    ) {}

    public record PassportDto(
            String level,
            Integer nextLevelIn,
            long hackathonsCompleted,
            long tasksConfirmed,
            long ideasApproved,
            int streakDays,
            List<DailyActivityDto> activity
    ) {}

    public record ResumeRoomDto(
            UUID id,
            String name,
            String cover,
            String type,
            NextStepDto nextStep,
            Instant lastVisitedAt
    ) {}

    public record HomeCountsDto(
            int rooms,
            int liveRooms
    ) {}

    public record HomeResponseDto(
            HomeUserDto user,
            Instant serverNow,
            List<HomeRoomCardDto> rooms,
            SelectedRoomDto selected,
            UserSummaryDto userSummary,
            long unreadNotificationCount,
            List<TaskDto> myOpenTasks,
            List<SelectedDeadlineRowDto> deadlinesAcrossRooms,
            String teamPulse,
            PassportDto passport,
            ResumeRoomDto resume,
            HomeCountsDto counts
    ) {
        public HomeResponseDto(
                HomeUserDto user,
                Instant serverNow,
                List<HomeRoomCardDto> rooms,
                SelectedRoomDto selected,
                UserSummaryDto userSummary,
                long unreadNotificationCount,
                List<TaskDto> myOpenTasks,
                List<SelectedDeadlineRowDto> deadlinesAcrossRooms,
                String teamPulse
        ) {
            this(user, serverNow, rooms, selected, userSummary, unreadNotificationCount, myOpenTasks, deadlinesAcrossRooms, teamPulse, null, null, new HomeCountsDto(rooms.size(), 0));
        }

        public HomeResponseDto(
                HomeUserDto user,
                Instant serverNow,
                List<HomeRoomCardDto> rooms,
                SelectedRoomDto selected
        ) {
            this(user, serverNow, rooms, selected, null, 0L, List.of(), List.of(), "Active sprint", null, null, new HomeCountsDto(rooms.size(), 0));
        }
    }
}
