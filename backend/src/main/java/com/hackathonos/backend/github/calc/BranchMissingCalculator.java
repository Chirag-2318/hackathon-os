package com.hackathonos.backend.github.calc;

import com.hackathonos.backend.github.GithubBranch;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class BranchMissingCalculator {

    public record MissingItem(String code, String label, String actionLabel, String actionUrl) {}

    /**
     * Pure calculation of what is missing or concerning about a branch:
     * NO_LINKED_TASK, NOT_IN_PR, DRAFT_TOO_LONG, PR_CONFLICTS, NO_REVIEW, MISSING_FROM_MAIN, STALE.
     */
    public static List<MissingItem> calculate(GithubBranch branch, boolean hasLinkedTask, Instant now) {
        if (branch == null) return Collections.emptyList();
        List<MissingItem> items = new ArrayList<>();

        // 1. NO_LINKED_TASK (not required for main branch)
        if (!"main".equalsIgnoreCase(branch.getName()) && !hasLinkedTask) {
            items.add(new MissingItem(
                    "NO_LINKED_TASK",
                    "No task linked to this branch",
                    "Link task",
                    null
            ));
        }

        // 2. NOT_IN_PR (not for main)
        if (!"main".equalsIgnoreCase(branch.getName()) && branch.getPrNumber() == null) {
            items.add(new MissingItem(
                    "NOT_IN_PR",
                    "Branch has no pull request",
                    "Open PR",
                    branch.getUrl()
            ));
        }

        // 3. DRAFT_TOO_LONG (PR is draft for >= 24 hours)
        if ("draft".equalsIgnoreCase(branch.getPrStatus()) && branch.getPrOpenedAt() != null) {
            if (Duration.between(branch.getPrOpenedAt(), now).toHours() >= 24) {
                items.add(new MissingItem(
                        "DRAFT_TOO_LONG",
                        "PR has been in draft for over 24 hours",
                        "Ready for review",
                        branch.getUrl()
                ));
            }
        }

        // 4. PR_CONFLICTS
        if (branch.isPrConflicts()) {
            items.add(new MissingItem(
                    "PR_CONFLICTS",
                    "Pull request has merge conflicts with base branch",
                    "Resolve conflicts",
                    branch.getUrl()
            ));
        }

        // 5. NO_REVIEW (open PR without reviewer for >= 12 hours)
        if ("open".equalsIgnoreCase(branch.getPrStatus()) && branch.getPrReviewerCount() == 0 && branch.getPrOpenedAt() != null) {
            if (Duration.between(branch.getPrOpenedAt(), now).toHours() >= 12) {
                items.add(new MissingItem(
                        "NO_REVIEW",
                        "PR has no reviewers assigned after 12 hours",
                        "Request review",
                        branch.getUrl()
                ));
            }
        }

        // 6. MISSING_FROM_MAIN (demo-safe branch behind main > 0)
        if ("demo-safe".equalsIgnoreCase(branch.getRole()) && branch.getBehind() > 0) {
            items.add(new MissingItem(
                    "MISSING_FROM_MAIN",
                    "Demo-safe branch is " + branch.getBehind() + " commits behind main",
                    "Rebase or merge",
                    branch.getUrl()
            ));
        }

        // 7. STALE (role is stale or last commit > 48 hours ago for non-main)
        boolean staleByTime = branch.getLastCommitAt() != null && Duration.between(branch.getLastCommitAt(), now).toHours() >= 48;
        if ("stale".equalsIgnoreCase(branch.getRole()) || (!"main".equalsIgnoreCase(branch.getName()) && staleByTime)) {
            items.add(new MissingItem(
                    "STALE",
                    "No commits on branch for over 48 hours",
                    "Check branch",
                    branch.getUrl()
            ));
        }

        return items;
    }
}
