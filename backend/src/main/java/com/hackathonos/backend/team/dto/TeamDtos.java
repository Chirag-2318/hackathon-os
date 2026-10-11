package com.hackathonos.backend.team.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hackathonos.backend.members.MemberStatusCalculator;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class TeamDtos {

    public record TeamMemberDto(
            UUID userId,
            String name,
            String initials,
            String avatarUrl,
            String role,
            List<String> skills,
            String status,
            MemberStatusCalculator.CurrentTaskInfo currentTask,
            long tasksDone,
            long tasksOpen,
            boolean isLeader,
            boolean isMe
    ) {}

    public record SkillMemberDto(
            UUID userId,
            String name,
            String avatarUrl
    ) {}

    public record SkillCoverageDto(
            String skill,
            int count,
            List<SkillMemberDto> members,
            boolean isGap
    ) {}

    public record RoleDistributionDto(
            String role,
            int count
    ) {}

    public record CharterGoalsCountDto(
            @JsonProperty("WIN") int win,
            @JsonProperty("LEARN") int learn,
            @JsonProperty("PORTFOLIO") int portfolio,
            @JsonProperty("ALL") int all
    ) {}

    public record CharterNormsDto(
            int acknowledged,
            int total
    ) {}

    public record MyCharterDto(
            String goal,
            int hoursAvailable,
            boolean normsAcknowledged
    ) {}

    public record TeamCharterSummaryDto(
            CharterGoalsCountDto goals,
            double averageHours,
            boolean mixedGoals,
            CharterNormsDto norms,
            MyCharterDto mine
    ) {}

    public record TeamResponseDto(
            List<TeamMemberDto> members,
            List<SkillCoverageDto> skillCoverage,
            List<RoleDistributionDto> roleDistribution,
            TeamCharterSummaryDto charter,
            Instant serverNow
    ) {}

    public record SaveCharterRequest(
            String goal,
            Integer hoursAvailable,
            Boolean normsAcknowledged
    ) {}
}
