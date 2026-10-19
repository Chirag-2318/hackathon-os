package com.hackathonos.backend.github.client;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface GitHubClient {

    record ClientRepo(
            String fullName,
            String name,
            String description,
            String url,
            String visibility,
            String defaultBranch,
            String language,
            int stars,
            String pushedDate,
            String htmlUrl,
            String licenseSpdx
    ) {
        public ClientRepo(String fullName, String url, String visibility, String defaultBranch, String licenseSpdx) {
            this(
                    fullName,
                    fullName != null && fullName.contains("/") ? fullName.substring(fullName.lastIndexOf('/') + 1) : (fullName != null ? fullName : ""),
                    "",
                    url,
                    visibility,
                    defaultBranch,
                    "",
                    0,
                    null,
                    url,
                    licenseSpdx
            );
        }
    }

    default int getRateLimitRemaining() {
        return 60;
    }

    record ClientBranch(String name, String sha) {}

    record ClientBranchCompare(int aheadBy, int behindBy) {}

    record ClientPr(int number, String title, String headBranch, String state, boolean draft, Instant openedAt) {}

    record ClientPrDetail(boolean mergeable, int requestedReviewersCount) {}

    record ClientCommit(String sha, String message, String authorLogin, String authorName, Instant committedAt) {}

    record ClientCommitDetail(int additions, int deletions) {}

    record UserRepo(String fullName, boolean isPrivate, Instant updatedAt) {}

    Optional<ClientRepo> getRepo(String owner, String repo, String token);

    List<ClientBranch> listBranches(String owner, String repo, String token);

    ClientBranchCompare compareBranches(String owner, String repo, String base, String head, String token);

    List<ClientPr> listPullRequests(String owner, String repo, String token);

    ClientPrDetail getPullRequest(String owner, String repo, int prNumber, String token);

    List<ClientCommit> listCommits(String owner, String repo, String branchOrSha, Instant since, Instant until, String token);

    Optional<ClientCommitDetail> getCommitDetail(String owner, String repo, String sha, String token);

    List<String> getTreeFilePaths(String owner, String repo, String branch, String token);

    Optional<String> getReadmeContent(String owner, String repo, String token);

    List<UserRepo> listUserRepos(String token);
}
