package com.hackathonos.backend.github.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class GithubDtos {

    public record ConnectRepoRequest(String repo, String repoName) {
        public String getEffectiveRepo() {
            return repo != null && !repo.isBlank() ? repo : repoName;
        }
    }

    public record LinkRepoRequest(String url, String repo) {
        public String getEffectiveUrl() {
            return url != null && !url.isBlank() ? url : repo;
        }
    }

    public record RepoSummarySectionDto(
            String name,
            String description,
            String visibility,
            String defaultBranch,
            String language,
            int stars,
            String pushedDate,
            String htmlUrl,
            String fullName,
            boolean connected
    ) {}

    public record SectionResponse<T>(
            String state,
            T data,
            String error,
            String notice
    ) {
        public static <T> SectionResponse<T> ready(T data) {
            return new SectionResponse<>("READY", data, null, null);
        }
        public static <T> SectionResponse<T> readyWithNotice(T data, String notice) {
            return new SectionResponse<>("READY", data, null, notice);
        }
        public static <T> SectionResponse<T> partial(T data, String error, String notice) {
            return new SectionResponse<>("PARTIAL", data, error, notice);
        }
        public static <T> SectionResponse<T> error(String error) {
            return new SectionResponse<>("ERROR", null, error, null);
        }
    }

    public record CommitItemDto(
            String sha,
            String message,
            String authorLogin,
            String authorName,
            Instant committedAt,
            String url
    ) {}

    public record PullItemDto(
            int number,
            String title,
            String headBranch,
            String state,
            boolean draft,
            Instant openedAt,
            String url
    ) {}

    public record UpdateBranchRequest(String purpose, String role, UUID ownerId, Boolean replace) {}

    public record LinkBranchTasksRequest(List<UUID> taskIds) {}

    public record DeployedLinkRequest(String url) {}

    public record DeployedLinkResponse(boolean ok, int httpStatus) {}

    public record FreezeRequest(UUID branchId, String tag) {}

    public record FreezeResponse(FrozenDemoDto frozenDemo, String createTagUrl) {}

    public record FreezeCheck(String label, boolean ok, String detail) {}

    public record FreezeChecklistResponse(String branchHead, List<FreezeCheck> checks) {}

    public record RepoSummaryDto(
            String fullName,
            String url,
            String visibility,
            String access,
            Instant lastSyncAt,
            String syncStatus,
            String syncError,
            String defaultBranch,
            boolean connected
    ) {
        public RepoSummaryDto(String fullName, String url, String visibility, String access, Instant lastSyncAt, String syncStatus, String syncError) {
            this(fullName, url, visibility, access, lastSyncAt, syncStatus, syncError, "main", true);
        }
    }

    public record BandScoreDto(int passed, int total) {}

    public record BandRulesDto(String status, int preKickoffCount, String message) {}

    public record BandHistoryDto(
            String status,
            String label,
            int commitCount,
            int contributorCount,
            List<Integer> sparkline
    ) {}

    public record BandDemoDto(
            String status,
            String branch,
            String tag,
            String sha,
            Instant frozenAt,
            int commitsSince
    ) {}

    public record BandHealthDto(int passed, int total, List<String> missing) {}

    public record ReadinessBandDto(
            BandScoreDto score,
            String headline,
            String subline,
            BandRulesDto rules,
            BandHistoryDto history,
            BandDemoDto demo,
            BandHealthDto health
    ) {}

    public record BranchOwnerDto(UUID id, String name, String avatarUrl) {}

    public record BranchPrDto(
            int number,
            String title,
            String status,
            boolean conflicts,
            Instant openedAt,
            int reviewerCount
    ) {}

    public record LinkedTaskDto(UUID id, String key, String summary) {}

    public record BranchMissingDto(String code, String label, String actionLabel, String actionUrl) {}

    public record RecentCommitDto(String sha, String message, Instant committedAt, String authorName) {}

    public record BranchDto(
            UUID id,
            String name,
            String purpose,
            String role,
            BranchOwnerDto owner,
            Integer ahead,
            Integer behind,
            Instant lastCommitAt,
            String lastCommitSha,
            String lastCommitMessage,
            BranchPrDto pr,
            List<LinkedTaskDto> linkedTasks,
            List<BranchMissingDto> missing,
            List<RecentCommitDto> recentCommits,
            String url
    ) {}

    public record HealthActionDto(String label, String url) {}

    public record HealthItemDto(
            String key,
            String label,
            String status,
            boolean required,
            String detail,
            HealthActionDto action
    ) {}

    public record AttentionDto(
            String key,
            String severity,
            String title,
            String helper,
            String actionLabel,
            String actionRoute,
            String actionUrl
    ) {}

    public record ContributorDto(
            String name,
            String avatarUrl,
            UUID userId,
            int commits,
            Integer additions,
            Integer deletions,
            Instant lastActiveAt
    ) {}

    public record PermissionsDto(
            boolean canConnect,
            boolean canFreeze,
            boolean canEditBranches
    ) {}

    public record FrozenDemoDto(
            String branch,
            String tag,
            String sha,
            Instant frozenAt,
            int commitsSince
    ) {}

    public record GithubPageResponse(
            boolean connected,
            RepoSummaryDto repo,
            ReadinessBandDto band,
            List<BranchDto> branches,
            List<HealthItemDto> health,
            List<AttentionDto> attention,
            Object activity,
            List<ContributorDto> contributors,
            boolean busFactorWarning,
            FrozenDemoDto frozenDemo,
            String deployedLink,
            PermissionsDto permissions,
            Instant serverNow,
            Boolean canConnect,
            Boolean tokenAvailable
    ) {}

    public record MyRepoDto(String fullName, boolean isPrivate, Instant updatedAt) {}
    public record GitHubStatusDto(boolean linked, String login, boolean privateAccess) {}

    // ── CHECKS, CONTRIBUTORS, TASK-LINKS, DEMO-MARKER ──
    public record GithubCheckDto(
            String id,
            String label,
            String status, // PASS, WARN, FAIL, UNKNOWN
            String detail,
            String fixUrl,
            String fixLabel
    ) {}

    public record GithubContributorItemDto(
            UUID userId,
            String username,
            String displayName,
            String avatarUrl,
            String githubLogin,
            int commitsLast7Days,
            int prsOpened,
            int prsMerged,
            Instant lastCommitAt,
            boolean isMember
    ) {}

    public record GithubContributorsResponse(
            List<GithubContributorItemDto> members,
            List<GithubContributorItemDto> otherAuthors
    ) {}

    public record TaskCommitLinkDto(
            String sha,
            String message,
            String author,
            Instant committedAt,
            String url
    ) {}

    public record TaskPrLinkDto(
            int number,
            String title,
            String status,
            String url
    ) {}

    public record TaskBranchLinkDto(
            String name,
            String url
    ) {}

    public record TaskLinksItemDto(
            String taskKey,
            List<TaskCommitLinkDto> commits,
            List<TaskPrLinkDto> prs,
            List<TaskBranchLinkDto> branches
    ) {}

    public record GithubTaskLinksResponse(
            int totalCommits,
            int commitsWithTasks,
            String headerSummary,
            List<TaskLinksItemDto> tasks
    ) {}

    public record DemoMarkerDto(
            String branch,
            String sha,
            UUID markedBy,
            String markedByName,
            Instant markedAt,
            int commitsMoved,
            String summary
    ) {}

    public record SaveDemoMarkerRequest(String branch) {}
}
