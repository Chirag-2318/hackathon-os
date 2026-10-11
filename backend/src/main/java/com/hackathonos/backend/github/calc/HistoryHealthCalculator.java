package com.hackathonos.backend.github.calc;

import com.hackathonos.backend.github.GithubCommit;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

public class HistoryHealthCalculator {

    public record HistoryHealthResult(
            String status, // "healthy" | "thin" | "giant-commit" | "unknown"
            String label,
            int commitCount,
            int contributorCount,
            boolean busFactorWarning,
            List<Integer> sparkline
    ) {}

    /**
     * Pure calculation of commit history health: detects thin history, giant commits, and bus factor risks.
     */
    public static HistoryHealthResult calculate(List<GithubCommit> commits, Instant kickoff, Instant now) {
        if (commits == null || commits.isEmpty()) {
            return new HistoryHealthResult("thin", "No commits recorded yet", 0, 0, false, Collections.emptyList());
        }

        int totalCommits = commits.size();
        Set<String> contributors = new HashSet<>();
        Map<String, Integer> authorCommitCounts = new HashMap<>();
        Map<String, Integer> authorAdditions = new HashMap<>();

        long totalAdditions = 0;
        int maxCommitAdditions = 0;
        boolean hasAdditionMetrics = false;

        for (GithubCommit c : commits) {
            String author = c.getAuthorLogin() != null ? c.getAuthorLogin() : (c.getAuthorName() != null ? c.getAuthorName() : "unknown");
            contributors.add(author);
            authorCommitCounts.put(author, authorCommitCounts.getOrDefault(author, 0) + 1);

            if (c.getAdditions() != null) {
                hasAdditionMetrics = true;
                int adds = c.getAdditions();
                totalAdditions += adds;
                if (adds > maxCommitAdditions) {
                    maxCommitAdditions = adds;
                }
                authorAdditions.put(author, authorAdditions.getOrDefault(author, 0) + adds);
            }
        }

        // Bus factor: one author holding > 80% of commits or additions
        boolean busFactorWarning = false;
        for (int count : authorCommitCounts.values()) {
            if ((double) count / totalCommits > 0.80 && contributors.size() > 1) {
                busFactorWarning = true;
                break;
            }
        }
        if (!busFactorWarning && totalAdditions > 0) {
            for (int adds : authorAdditions.values()) {
                if ((double) adds / totalAdditions > 0.80 && contributors.size() > 1) {
                    busFactorWarning = true;
                    break;
                }
            }
        }

        // 4-hour sparkline buckets across commits
        List<Integer> sparkline = buildSparkline(commits, kickoff, now);

        // Check thin history: fewer than 10 commits after 24 hours of the event
        boolean past24Hours = kickoff != null && Duration.between(kickoff, now).toHours() >= 24;
        if (past24Hours && totalCommits < 10) {
            return new HistoryHealthResult("thin", "Fewer than 10 commits after 24 hours", totalCommits, contributors.size(), busFactorWarning, sparkline);
        }

        if (!hasAdditionMetrics) {
            return new HistoryHealthResult("unknown", "Commit line metrics not available", totalCommits, contributors.size(), busFactorWarning, sparkline);
        }

        // Giant commit check: one commit holds > 60% of total additions
        if (totalAdditions > 100 && ((double) maxCommitAdditions / totalAdditions) > 0.60) {
            return new HistoryHealthResult("giant-commit", "One commit holds > 60% of additions", totalCommits, contributors.size(), busFactorWarning, sparkline);
        }

        return new HistoryHealthResult("healthy", "Evenly distributed commit history", totalCommits, contributors.size(), busFactorWarning, sparkline);
    }

    private static List<Integer> buildSparkline(List<GithubCommit> commits, Instant kickoff, Instant now) {
        if (kickoff == null || now == null || !now.isAfter(kickoff)) {
            return List.of(commits.size());
        }
        long totalHours = Math.max(4, Duration.between(kickoff, now).toHours());
        int bucketCount = Math.max(1, (int) Math.ceil((double) totalHours / 4.0));
        int[] buckets = new int[bucketCount];

        for (GithubCommit c : commits) {
            if (c.getCommittedAt().isBefore(kickoff)) continue;
            long hoursSinceKickoff = Duration.between(kickoff, c.getCommittedAt()).toHours();
            int b = (int) (hoursSinceKickoff / 4);
            if (b >= 0 && b < bucketCount) {
                buckets[b]++;
            }
        }

        List<Integer> result = new ArrayList<>();
        for (int b : buckets) {
            result.add(b);
        }
        return result;
    }
}
