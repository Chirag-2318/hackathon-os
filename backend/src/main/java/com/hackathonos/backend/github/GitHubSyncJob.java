package com.hackathonos.backend.github;

import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
public class GitHubSyncJob {

    private static final Logger log = LoggerFactory.getLogger(GitHubSyncJob.class);

    private final GithubRepoRepository repoRepository;
    private final RoomRepository roomRepository;
    private final GitHubSyncService syncService;
    private final Clock clock;

    @Value("${app.jobs.github-sync.enabled:true}")
    private boolean enabled;

    private final com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService;

    public GitHubSyncJob(GithubRepoRepository repoRepository,
                         RoomRepository roomRepository,
                         GitHubSyncService syncService,
                         Clock clock,
                         com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService) {
        this.repoRepository = repoRepository;
        this.roomRepository = roomRepository;
        this.syncService = syncService;
        this.clock = clock;
        this.advisoryLockService = advisoryLockService;
    }

    @Scheduled(cron = "${app.jobs.github-sync.cron:0 */10 * * * *}")
    public void schedule() {
        if (!enabled) return;
        advisoryLockService.tryLockAndRun(1007L, this::runSyncJob);
    }

    /**
     * Executes the background sync for rooms in build stage with a connected repository.
     * Skips rooms synced within the last 5 minutes.
     */
    public int runSyncJob() {
        List<GithubRepo> repos = repoRepository.findAll();
        Instant now = clock.instant();
        int synced = 0;

        for (GithubRepo repo : repos) {
            Room room = roomRepository.findById(repo.getRoomId()).orElse(null);
            if (room == null || !"build".equalsIgnoreCase(room.getStage())) {
                continue;
            }

            if (repo.getLastSyncAt() != null && Duration.between(repo.getLastSyncAt(), now).toMinutes() < 5) {
                continue;
            }

            try {
                syncService.sync(room, repo.getConnectedBy());
                synced++;
                Thread.sleep(50); // Short pause between room syncs
            } catch (Exception e) {
                log.warn("Scheduled GitHub sync failed for room {}: {}", repo.getRoomId(), e.getMessage());
            }
        }
        return synced;
    }
}
