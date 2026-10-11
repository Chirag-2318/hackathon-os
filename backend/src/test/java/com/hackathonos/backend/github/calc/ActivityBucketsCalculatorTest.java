package com.hackathonos.backend.github.calc;

import com.hackathonos.backend.github.GithubCommit;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ActivityBucketsCalculatorTest {

    private final UUID roomId = UUID.randomUUID();

    @Test
    void testEmptyCommitsCalculatesDefaultBuckets() {
        Instant kickoff = Instant.parse("2026-10-10T10:00:00Z");
        Instant now = kickoff.plus(Duration.ofHours(24));

        ActivityBucketsCalculator.ActivityResult result = ActivityBucketsCalculator.calculate(List.of(), kickoff, null, now);

        assertNotNull(result);
        assertEquals(kickoff, result.kickoffAt());
        // 24 hours / 3 hours = 8 buckets
        assertEquals(8, result.buckets().size());
        for (ActivityBucketsCalculator.ActivityBucket bucket : result.buckets()) {
            assertEquals(0, bucket.count());
            assertFalse(bucket.beforeKickoff());
            assertTrue(bucket.byAuthor().isEmpty());
        }
    }

    @Test
    void testPreKickoffBucketCreated() {
        Instant kickoff = Instant.parse("2026-10-10T10:00:00Z");
        Instant preTime1 = kickoff.minus(Duration.ofHours(2));
        Instant preTime2 = kickoff.minus(Duration.ofHours(1));

        GithubCommit c1 = new GithubCommit(roomId, "sha1", "init repo", "alice", "Alice", UUID.randomUUID(), preTime1, 10, 2, "main");
        GithubCommit c2 = new GithubCommit(roomId, "sha2", "scaffold", "alice", "Alice", UUID.randomUUID(), preTime2, 20, 5, "main");

        ActivityBucketsCalculator.ActivityResult result = ActivityBucketsCalculator.calculate(List.of(c1, c2), kickoff, null, kickoff.plus(Duration.ofHours(24)));

        assertNotNull(result);
        // First bucket should be beforeKickoff
        ActivityBucketsCalculator.ActivityBucket firstBucket = result.buckets().get(0);
        assertTrue(firstBucket.beforeKickoff());
        assertEquals(2, firstBucket.count());
        assertEquals(1, firstBucket.byAuthor().size());
        assertEquals("alice", firstBucket.byAuthor().get(0).name());
        assertEquals(2, firstBucket.byAuthor().get(0).count());
    }

    @Test
    void testCommitsGroupedAndAuthorsSorted() {
        Instant kickoff = Instant.parse("2026-10-10T10:00:00Z");
        Instant t1 = kickoff.plus(Duration.ofHours(1));
        Instant t2 = kickoff.plus(Duration.ofHours(2));
        Instant t3 = kickoff.plus(Duration.ofHours(2));

        GithubCommit c1 = new GithubCommit(roomId, "sha1", "feat A", "bob", "Bob", UUID.randomUUID(), t1, 15, 0, "main");
        GithubCommit c2 = new GithubCommit(roomId, "sha2", "feat B", "alice", "Alice", UUID.randomUUID(), t2, 20, 1, "main");
        GithubCommit c3 = new GithubCommit(roomId, "sha3", "feat C", "alice", "Alice", UUID.randomUUID(), t3, 10, 0, "main");

        ActivityBucketsCalculator.ActivityResult result = ActivityBucketsCalculator.calculate(List.of(c1, c2, c3), kickoff, null, kickoff.plus(Duration.ofHours(24)));

        assertNotNull(result);
        ActivityBucketsCalculator.ActivityBucket firstSlice = result.buckets().get(0);
        assertFalse(firstSlice.beforeKickoff());
        assertEquals(3, firstSlice.count());
        assertEquals(2, firstSlice.byAuthor().size());

        // Alice has 2, Bob has 1 -> Alice should be first
        assertEquals("alice", firstSlice.byAuthor().get(0).name());
        assertEquals(2, firstSlice.byAuthor().get(0).count());
        assertEquals("bob", firstSlice.byAuthor().get(1).name());
        assertEquals(1, firstSlice.byAuthor().get(1).count());
    }

    @Test
    void testHorizonExtendsToFreeze() {
        Instant kickoff = Instant.parse("2026-10-10T10:00:00Z");
        Instant now = kickoff.plus(Duration.ofHours(10));
        Instant freeze = kickoff.plus(Duration.ofHours(36));

        ActivityBucketsCalculator.ActivityResult result = ActivityBucketsCalculator.calculate(List.of(), kickoff, freeze, now);

        assertNotNull(result);
        // 36 hours / 3 hours = 12 buckets
        assertEquals(12, result.buckets().size());
    }
}
