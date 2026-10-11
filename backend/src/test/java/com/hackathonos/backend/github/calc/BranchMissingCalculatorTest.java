package com.hackathonos.backend.github.calc;

import com.hackathonos.backend.github.GithubBranch;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class BranchMissingCalculatorTest {

    private final UUID roomId = UUID.randomUUID();

    private GithubBranch createBranch(String name, String role, Integer prNumber, String prStatus,
                                       boolean prConflicts, Instant prOpenedAt, int reviewerCount,
                                       int behind, Instant lastCommitAt, Instant now) {
        return new GithubBranch(
                roomId, name, "purpose", role, false,
                null, 0, behind, "sha1", "msg", lastCommitAt != null ? lastCommitAt : now,
                prNumber, "PR Title", prStatus, prConflicts, prOpenedAt,
                reviewerCount, "https://github.com/repo/tree/" + name, now
        );
    }

    @Test
    void testMainBranchIgnoresNoLinkedTaskAndNotInPr() {
        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        GithubBranch main = createBranch("main", "main", null, null, false, null, 0, 0, now, now);

        List<BranchMissingCalculator.MissingItem> items = BranchMissingCalculator.calculate(main, false, now);

        assertTrue(items.stream().noneMatch(i -> "NO_LINKED_TASK".equals(i.code())));
        assertTrue(items.stream().noneMatch(i -> "NOT_IN_PR".equals(i.code())));
    }

    @Test
    void testFeatureBranchMissingTaskAndPr() {
        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        GithubBranch feature = createBranch("feat-auth", "experiment", null, null, false, null, 0, 0, now, now);

        List<BranchMissingCalculator.MissingItem> items = BranchMissingCalculator.calculate(feature, false, now);

        assertTrue(items.stream().anyMatch(i -> "NO_LINKED_TASK".equals(i.code())));
        assertTrue(items.stream().anyMatch(i -> "NOT_IN_PR".equals(i.code())));
    }

    @Test
    void testDraftTooLong() {
        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        Instant prOpenedAt = now.minus(Duration.ofHours(25));
        GithubBranch branch = createBranch("feat-ui", "experiment", 42, "draft", false, prOpenedAt, 0, 0, now, now);

        List<BranchMissingCalculator.MissingItem> items = BranchMissingCalculator.calculate(branch, true, now);

        assertTrue(items.stream().anyMatch(i -> "DRAFT_TOO_LONG".equals(i.code())));
    }

    @Test
    void testPrConflictsAndNoReview() {
        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        Instant prOpenedAt = now.minus(Duration.ofHours(14));
        GithubBranch branch = createBranch("feat-db", "experiment", 101, "open", true, prOpenedAt, 0, 0, now, now);

        List<BranchMissingCalculator.MissingItem> items = BranchMissingCalculator.calculate(branch, true, now);

        assertTrue(items.stream().anyMatch(i -> "PR_CONFLICTS".equals(i.code())));
        assertTrue(items.stream().anyMatch(i -> "NO_REVIEW".equals(i.code())));
    }

    @Test
    void testDemoSafeBehindMain() {
        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        GithubBranch demoSafe = createBranch("demo-safe", "demo-safe", 202, "merged", false, now.minus(Duration.ofHours(2)), 1, 3, now, now);

        List<BranchMissingCalculator.MissingItem> items = BranchMissingCalculator.calculate(demoSafe, true, now);

        assertTrue(items.stream().anyMatch(i -> "MISSING_FROM_MAIN".equals(i.code())));
    }

    @Test
    void testStaleBranchOver48Hours() {
        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        Instant lastCommit = now.minus(Duration.ofHours(50));
        GithubBranch branch = createBranch("old-exp", "experiment", 50, "open", false, lastCommit, 1, 0, lastCommit, now);

        List<BranchMissingCalculator.MissingItem> items = BranchMissingCalculator.calculate(branch, true, now);

        assertTrue(items.stream().anyMatch(i -> "STALE".equals(i.code())));
    }
}
