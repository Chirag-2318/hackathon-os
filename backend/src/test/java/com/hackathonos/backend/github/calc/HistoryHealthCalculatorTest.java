package com.hackathonos.backend.github.calc;

import com.hackathonos.backend.github.GithubCommit;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class HistoryHealthCalculatorTest {

    private final UUID roomId = UUID.randomUUID();

    @Test
    void testEmptyCommitsReturnsThin() {
        HistoryHealthCalculator.HistoryHealthResult result =
                HistoryHealthCalculator.calculate(List.of(), Instant.now(), Instant.now());

        assertEquals("thin", result.status());
        assertEquals("No commits recorded yet", result.label());
        assertEquals(0, result.commitCount());
        assertFalse(result.busFactorWarning());
        assertTrue(result.sparkline().isEmpty());
    }

    @Test
    void testThinHistoryPast24Hours() {
        Instant kickoff = Instant.parse("2026-10-10T10:00:00Z");
        Instant now = kickoff.plus(Duration.ofHours(30));

        List<GithubCommit> commits = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            commits.add(new GithubCommit(
                    roomId, "sha" + i, "feat " + i, "dev", "Dev",
                    UUID.randomUUID(), kickoff.plus(Duration.ofHours(i + 1)), 20, 2, "main"
            ));
        }

        HistoryHealthCalculator.HistoryHealthResult result =
                HistoryHealthCalculator.calculate(commits, kickoff, now);

        assertEquals("thin", result.status());
        assertEquals(5, result.commitCount());
        assertTrue(result.label().contains("Fewer than 10 commits"));
    }

    @Test
    void testGiantCommitDetected() {
        Instant kickoff = Instant.parse("2026-10-10T10:00:00Z");
        Instant now = kickoff.plus(Duration.ofHours(10));

        List<GithubCommit> commits = new ArrayList<>();
        // 1 commit with 800 additions
        commits.add(new GithubCommit(
                roomId, "shaBig", "giant dump", "alice", "Alice",
                UUID.randomUUID(), kickoff.plus(Duration.ofHours(1)), 800, 10, "main"
        ));
        // 10 small commits with 10 additions each
        for (int i = 0; i < 10; i++) {
            commits.add(new GithubCommit(
                    roomId, "sha" + i, "small " + i, "bob", "Bob",
                    UUID.randomUUID(), kickoff.plus(Duration.ofHours(2 + i)), 10, 1, "main"
            ));
        }

        HistoryHealthCalculator.HistoryHealthResult result =
                HistoryHealthCalculator.calculate(commits, kickoff, now);

        assertEquals("giant-commit", result.status());
        assertTrue(result.label().contains("> 60% of additions"));
    }

    @Test
    void testBusFactorWarning() {
        Instant kickoff = Instant.parse("2026-10-10T10:00:00Z");
        Instant now = kickoff.plus(Duration.ofHours(10));

        List<GithubCommit> commits = new ArrayList<>();
        // Alice does 18 commits
        for (int i = 0; i < 18; i++) {
            commits.add(new GithubCommit(
                    roomId, "shaA" + i, "alice " + i, "alice", "Alice",
                    UUID.randomUUID(), kickoff.plus(Duration.ofMinutes(10 * i)), 15, 2, "main"
            ));
        }
        // Bob does 2 commits (Alice has 18/20 = 90% > 80%)
        for (int i = 0; i < 2; i++) {
            commits.add(new GithubCommit(
                    roomId, "shaB" + i, "bob " + i, "bob", "Bob",
                    UUID.randomUUID(), kickoff.plus(Duration.ofMinutes(200 + 10 * i)), 15, 2, "main"
            ));
        }

        HistoryHealthCalculator.HistoryHealthResult result =
                HistoryHealthCalculator.calculate(commits, kickoff, now);

        assertTrue(result.busFactorWarning());
    }

    @Test
    void testHealthyCommitHistory() {
        Instant kickoff = Instant.parse("2026-10-10T10:00:00Z");
        Instant now = kickoff.plus(Duration.ofHours(12));

        List<GithubCommit> commits = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            String author = (i % 3 == 0) ? "alice" : (i % 3 == 1 ? "bob" : "carol");
            commits.add(new GithubCommit(
                    roomId, "sha" + i, "step " + i, author, author,
                    UUID.randomUUID(), kickoff.plus(Duration.ofHours(i)), 30, 5, "main"
            ));
        }

        HistoryHealthCalculator.HistoryHealthResult result =
                HistoryHealthCalculator.calculate(commits, kickoff, now);

        assertEquals("healthy", result.status());
        assertEquals(12, result.commitCount());
        assertEquals(3, result.contributorCount());
        assertFalse(result.busFactorWarning());
        assertFalse(result.sparkline().isEmpty());
    }
}
