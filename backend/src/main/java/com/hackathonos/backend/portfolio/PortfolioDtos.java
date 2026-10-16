package com.hackathonos.backend.portfolio;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class PortfolioDtos {

    public record CustomLinkDto(
            String label,
            String url
    ) {}

    public record PortfolioSettingsDto(
            boolean isPublic,
            String slug,
            String bio,
            List<CustomLinkDto> customLinks
    ) {}

    public record UserProfileDto(
            UUID id,
            String name,
            String username,
            String email,
            String avatarUrl,
            String avatarType,
            Integer avatarPreset,
            String provider,
            String githubLogin,
            Instant joinedAt,
            String bio,
            List<CustomLinkDto> customLinks,
            String builderLine
    ) {}

    public record PortfolioStatsDto(
            long hackathonsJoined,
            long projectsShipped,
            long tasksCompleted,
            long teamsLed,
            long teammatesCount,
            int streakDays,
            int totalBuildDays
    ) {}

    public record TeamMemberSummaryDto(
            UUID id,
            String name,
            String username,
            String avatarUrl,
            String avatarType,
            Integer avatarPreset,
            String role
    ) {}

    public record ProjectLinksDto(
            String demoUrl,
            String videoUrl,
            String deckUrl,
            String repoUrl,
            String liveUrl,
            String submissionUrl
    ) {}

    public record ContributionDto(
            int tasksCompleted,
            int ideasAccepted,
            int commitsCount,
            int additions,
            int deletions,
            List<String> taskSummaries
    ) {}

    public record AwardDto(
            UUID id,
            String name,
            String detail
    ) {}

    public record CaseStudyDetailDto(
            String problem,
            String whatWeBuilt,
            List<String> techStack,
            ContributionDto myContribution,
            List<TeamMemberSummaryDto> team,
            ProjectLinksDto links,
            String outcome,
            List<AwardDto> awards
    ) {}

    public record ProjectCardDto(
            UUID roomId,
            String name,
            String hackathonName,
            String dates,
            String role,
            String pitch,
            List<String> techStack,
            List<TeamMemberSummaryDto> team,
            ProjectLinksDto links,
            boolean pinned,
            int pinOrder,
            boolean visible,
            String coverImageUrl,
            String status,
            CaseStudyDetailDto caseStudy
    ) {}

    public record PassportStampDto(
            UUID roomId,
            String name,
            String eventName,
            String dates,
            String role,
            String furthestStage,
            boolean isSubmitted,
            String outcome,
            boolean pinned,
            boolean visible,
            CaseStudyDetailDto caseStudy
    ) {}

    public record DailyActivityDto(
            String date,
            int count,
            int tasksCount,
            int commitsCount,
            int ideasCount,
            int docsCount
    ) {}

    public record BusiestDayDto(
            String date,
            int count,
            String roomName
    ) {}

    public record ActivityHeatmapDto(
            List<DailyActivityDto> days,
            BusiestDayDto busiestDay,
            int totalActions
    ) {}

    public record StackItemDto(
            String name,
            String category,
            int projectCount,
            List<String> projectNames
    ) {}

    public record RoleFingerprintDto(
            int builderTasks,
            int leaderActions,
            int productIdeas,
            int pitchPresence,
            int total
    ) {}

    public record CollaboratorDto(
            UUID id,
            String name,
            String username,
            String avatarUrl,
            String avatarType,
            Integer avatarPreset,
            int sharedHackathonsCount,
            boolean publicPortfolio
    ) {}

    public record MilestoneDto(
            String id,
            String title,
            String description,
            boolean earned,
            String earnedAt,
            int progress,
            int target,
            String icon
    ) {}

    public record FullPortfolioResponse(
            UserProfileDto profile,
            PortfolioSettingsDto settings,
            PortfolioStatsDto stats,
            List<ProjectCardDto> featuredProjects,
            List<PassportStampDto> timelineStamps,
            ActivityHeatmapDto heatmap,
            List<StackItemDto> stackConstellation,
            RoleFingerprintDto roleFingerprint,
            List<CollaboratorDto> collaborators,
            List<MilestoneDto> milestones,
            boolean isOwner
    ) {}

    public record UpdateSettingsRequest(
            Boolean isPublic,
            String slug,
            String bio,
            List<CustomLinkDto> customLinks
    ) {}

    public record UpdateProjectCurationRequest(
            Boolean pinned,
            Integer pinOrder,
            Boolean visible
    ) {}

    // Backwards compatibility for existing Retro & Settings usages if any
    public record LessonSummaryDto(
            String tag,
            long count
    ) {}

    public record PortfolioDashboardResponse(
            PortfolioSettingsDto settings,
            List<ProjectCardDto> items,
            List<LessonSummaryDto> lessons
    ) {}

    public record SetVisibilityRequest(
            Boolean visible
    ) {}

    public record PublicItemDto(
            String name,
            String dates,
            String identity,
            ProjectLinksDto links,
            String result,
            List<AwardDto> awards
    ) {}

    public record PublicPortfolioResponse(
            String name,
            String avatarUrl,
            List<PublicItemDto> items
    ) {}
}
