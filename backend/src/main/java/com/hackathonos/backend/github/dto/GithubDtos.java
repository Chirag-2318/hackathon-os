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
            String syncError
    ) {}

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
            int ahead,
            int behind,
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
}
