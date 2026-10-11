package com.hackathonos.backend.retro;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class RetroDtos {

    public record RetroFactsDto(
            Integer firstWorkingDemoHour,
            Integer submissionStartedHour,
            Integer videoRecordedHour,
            int commitCount,
            int tasksDone,
            int tasksTotal,
            int ideasApproved
    ) {}

    public record TimelineMilestoneDto(
            String id,
            String title,
            String label,
            int hour,
            String phase
    ) {}

    public record ProjectLinksDto(
            String repoUrl,
            String videoUrl,
            String deployedUrl
    ) {}

    public record TeamMemberDto(
            String name,
            String avatarUrl,
            String role,
            List<String> skills
    ) {}

    public record RetroItemDto(
            UUID id,
            String text,
            String tag,
            String kind,
            String author
    ) {}

    public record AwardDto(
            UUID id,
            String name,
            String detail
    ) {}

    public record TimeDistributionDto(
            String phase,
            String label,
            int tasksDone,
            double hours,
            double plannedHours,
            double actualHours
    ) {}

    public record PermissionsDto(
            boolean canDecide
    ) {}

    // Frontend compatibility wrappers
    public record WrappedStatsDto(
            int hours,
            int tasksDone,
            int firstWorkingDemoHour,
            int rehearsals
    ) {}

    public record RetroAnswersDto(
            String worked,
            String didnt,
            String change
    ) {}

    public record TwoWeekPlanDto(
            List<String> week1,
            List<String> week2
    ) {}

    public record PortfolioLinkDto(
            String label,
            String url
    ) {}

    public record PortfolioAwardDto(
            String title,
            String event
    ) {}

    public record PortfolioProjectDto(
            String name,
            String description
    ) {}

    public record PortfolioEntryDto(
            PortfolioProjectDto project,
            String role,
            List<PortfolioLinkDto> links,
            List<PortfolioAwardDto> awards
    ) {}

    public record RetroResponse(
            boolean eventEnded,
            RetroFactsDto facts,
            List<TimelineMilestoneDto> timeline,
            ProjectLinksDto links,
            List<TeamMemberDto> team,
            List<RetroItemDto> wentWell,
            List<RetroItemDto> didntGo,
            List<RetroItemDto> change,
            List<String> tags,
            String decision,
            String nextSteps,
            String result,
            List<AwardDto> awards,
            String portfolioSummary,
            List<TimeDistributionDto> timeDistribution,
            PermissionsDto permissions,
            // UI compatibility
            WrappedStatsDto wrapped,
            List<TimelineMilestoneDto> milestones,
            List<TimeDistributionDto> phaseTime,
            RetroAnswersDto retro,
            TwoWeekPlanDto twoWeekPlan,
            PortfolioEntryDto portfolio,
            Instant serverNow
    ) {}

    public record UpdateRetroRequest(
            String decision,
            String nextSteps,
            String result,
            String portfolioSummary
    ) {}

    public record CreateRetroItemRequest(
            String kind,
            String text,
            String tag
    ) {}

    public record CreateAwardRequest(
            String name,
            String detail
    ) {}
}
