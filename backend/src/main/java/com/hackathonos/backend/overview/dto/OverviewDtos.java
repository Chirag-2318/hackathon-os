package com.hackathonos.backend.overview.dto;

import com.hackathonos.backend.activity.dto.ActivityItemDto;
import com.hackathonos.backend.checkpoints.dto.CheckpointDtos.CheckpointItemDto;
import com.hackathonos.backend.overview.ClockService;
import com.hackathonos.backend.overview.ProgressService;
import com.hackathonos.backend.overview.WorkloadService;
import com.hackathonos.backend.overview.attention.AttentionItem;
import com.hackathonos.backend.tasks.dto.TaskDto;
import com.hackathonos.backend.tasks.dto.TaskPhaseSummaryDto;
import com.hackathonos.backend.team.dto.TeamDtos.SkillCoverageDto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class OverviewDtos {

    public record RoomSummaryDto(
            UUID id,
            String name,
            String templateName,
            String stage,
            Instant eventStart,
            Instant eventEnd
    ) {}

    public record NavBadgesDto(
            long board,
            long attention,
            long openTasks,
            long attentionCount,
            long github,
            long submission,
            long mentor
    ) {}

    // Planning variant
    public record PlanningOverviewResponse(
            String variant,
            RoomSummaryDto room,
            Object journey,
            String brief,
            PlanningIdeasDto ideas,
            PlanningTeamDto team,
            Instant serverNow
    ) {}

    public record PlanningIdeasDto(
            long pending,
            long approved,
            long rejected,
            List<ContributorWaitingDto> contributorsWaiting
    ) {}

    public record ContributorWaitingDto(
            UUID userId,
            String name,
            String avatarUrl
    ) {}

    public record PlanningTeamDto(
            List<OverviewMemberDto> members,
            List<SkillCoverageDto> skillCoverage
    ) {}

    // Build variant
    public record BuildOverviewResponse(
            String variant,
            RoomSummaryDto room,
            ClockService.ClockStatusDto clock,
            List<ClockService.TimelineSegmentDto> timeline,
            TaskPhaseSummaryDto currentPhase,
            OverviewVitalsDto vitals,
            List<AttentionItem> attention,
            List<CheckpointItemDto> checkpoints,
            ProgressService.ProgressResultDto progress,
            OverviewMyTasksDto myTasks,
            List<ActivityItemDto> activity,
            ProjectSnapshotDto project,
            OverviewTeamDto team,
            List<WorkloadService.MemberWorkloadDto> workload,
            Instant serverNow
    ) {}

    public record OverviewVitalsDto(
            VitalsCheckpointsDto checkpoints,
            VitalsTasksDto tasks,
            VitalsVsPlanDto vsPlan,
            VitalsTeamDto team
    ) {}

    public record VitalsCheckpointsDto(
            long passed,
            long total
    ) {}

    public record VitalsTasksDto(
            long open,
            long todo,
            long inProgress,
            long blocked
    ) {}

    public record VitalsVsPlanDto(
            int deltaPct,
            int actualPct,
            int plannedPct,
            String label
    ) {}

    public record VitalsTeamDto(
            long active,
            long total,
            List<VitalsTeamMemberDto> members
    ) {}

    public record VitalsTeamMemberDto(
            UUID userId,
            String name,
            String avatarUrl,
            String status
    ) {}

    public record OverviewMyTasksDto(
            List<TaskDto> now,
            List<TaskDto> today,
            List<TaskDto> later,
            int openCount
    ) {}

    public record ProjectSnapshotDto(
            String name,
            String identity,
            List<RubricCriterionDto> rubric,
            MvpHealthSnapshotDto mvpHealth,
            List<String> rules,
            List<String> tracks
    ) {}

    public record RubricCriterionDto(
            String criterion,
            int weight
    ) {}

    public record MvpHealthSnapshotDto(
            int passed,
            int total,
            MvpHealthChecksDto checks
    ) {}

    public record MvpHealthChecksDto(
            boolean runs,
            boolean stable,
            boolean clear30,
            boolean wow60
    ) {}

    public record OverviewTeamDto(
            List<OverviewMemberDto> members,
            List<SkillCoverageDto> skillCoverage
    ) {}

    public record OverviewMemberDto(
            UUID userId,
            String name,
            String avatarUrl,
            String role,
            String status,
            CurrentTaskDto currentTask
    ) {}

    public record CurrentTaskDto(
            String key,
            String summary
    ) {}
}
