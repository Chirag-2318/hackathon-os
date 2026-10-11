package com.hackathonos.backend.github.calc;

import com.hackathonos.backend.github.GithubCommit;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

public class ActivityBucketsCalculator {

    public record AuthorCount(String name, int count) {}

    public record ActivityBucket(
            Instant startAt,
            Instant endAt,
            int count,
            List<AuthorCount> byAuthor,
            boolean beforeKickoff
    ) {}

    public record ActivityResult(
            List<ActivityBucket> buckets,
            Instant kickoffAt,
            Instant freezeAt,
            Instant now
    ) {}

    /**
     * Pure calculation of 3-hour commit activity buckets across event timeline.
     */
    public static ActivityResult calculate(List<GithubCommit> commits, Instant kickoff, Instant freeze, Instant now) {
        if (kickoff == null) kickoff = now != null ? now.minus(Duration.ofHours(24)) : Instant.now().minus(Duration.ofHours(24));
        if (now == null) now = Instant.now();

        List<ActivityBucket> buckets = new ArrayList<>();

        // 1. Pre-kickoff bucket if any commits exist before kickoff
        List<GithubCommit> preKickoff = new ArrayList<>();
        List<GithubCommit> duringEvent = new ArrayList<>();

        if (commits != null) {
            for (GithubCommit c : commits) {
                if (c.getCommittedAt().isBefore(kickoff)) {
                    preKickoff.add(c);
                } else {
                    duringEvent.add(c);
                }
            }
        }

        if (!preKickoff.isEmpty()) {
            Instant earliest = preKickoff.stream().map(GithubCommit::getCommittedAt).min(Instant::compareTo).orElse(kickoff.minus(Duration.ofHours(3)));
            buckets.add(createBucket(earliest, kickoff, preKickoff, true));
        }

        // 2. 3-hour slices from kickoff to max(now, freeze or kickoff + 24h)
        Instant horizon = now;
        if (freeze != null && freeze.isAfter(horizon)) horizon = freeze;
        if (Duration.between(kickoff, horizon).toHours() < 24) {
            horizon = kickoff.plus(Duration.ofHours(24));
        }

        Instant current = kickoff;
        while (current.isBefore(horizon)) {
            Instant next = current.plus(Duration.ofHours(3));
            final Instant bStart = current;
            final Instant bEnd = next;

            List<GithubCommit> bucketCommits = new ArrayList<>();
            for (GithubCommit c : duringEvent) {
                if (!c.getCommittedAt().isBefore(bStart) && c.getCommittedAt().isBefore(bEnd)) {
                    bucketCommits.add(c);
                }
            }
            buckets.add(createBucket(bStart, bEnd, bucketCommits, false));
            current = next;
        }

        return new ActivityResult(buckets, kickoff, freeze, now);
    }

    private static ActivityBucket createBucket(Instant start, Instant end, List<GithubCommit> commits, boolean beforeKickoff) {
        Map<String, Integer> authorMap = new HashMap<>();
        for (GithubCommit c : commits) {
            String author = c.getAuthorLogin() != null ? c.getAuthorLogin() : (c.getAuthorName() != null ? c.getAuthorName() : "unknown");
            authorMap.put(author, authorMap.getOrDefault(author, 0) + 1);
        }
        List<AuthorCount> byAuthor = new ArrayList<>();
        for (Map.Entry<String, Integer> e : authorMap.entrySet()) {
            byAuthor.add(new AuthorCount(e.getKey(), e.getValue()));
        }
        byAuthor.sort((a, b) -> Integer.compare(b.count(), a.count()));
        return new ActivityBucket(start, end, commits.size(), byAuthor, beforeKickoff);
    }
}
