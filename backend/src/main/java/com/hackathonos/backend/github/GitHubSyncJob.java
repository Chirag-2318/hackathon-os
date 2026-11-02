package com.hackathonos.backend.github;

import com.hackathonos.backend.common.lock.DbAdvisoryLockService;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Component
public class GitHubSyncJob {

    private static final Logger log = LoggerFactory.getLogger(GitHubSyncJob.class);

    private final GithubRepoRepository repoRepository;
    private final RoomRepository roomRepository;
    private final GitHubSyncService syncService;
    private final Clock clock;

    @Value("${app.jobs.github-sync.enabled:true}")
    private boolean enabled;

    private final DbAdvisoryLockService advisoryLockService;

    public GitHubSyncJob(GithubRepoRepository repoRepository,
                         RoomRepository roomRepository,
                         GitHubSyncService syncService,
                         Clock clock,
                         DbAdvisoryLockService advisoryLockService) {
        this.repoRepository = repoRepository;
        this.roomRepository = roomRepository;
        this.syncService = syncService;
        this.clock = clock;
        this.advisoryLockService = advisoryLockService;
    }

    @Scheduled(cron = "${app.jobs.github-sync.cron:0 */10 * * * *}")
    public void schedule() {
        if (!enabled) return;
        runSyncJob();
    }

    public record SyncTarget(Room room, UUID connectedBy) {}

    /**
     * Executes background sync for rooms in build stage with a connected repository.
     * Claims work inside a short transaction using transaction advisory lock, then
     * executes external GitHub API calls without holding a database connection.
     */
    public int runSyncJob() {
        Instant now = clock.instant();

        List<SyncTarget> targets = advisoryLockService.tryXactLockAndClaim(1007L, () -> {
            List<GithubRepo> repos = repoRepository.findAll();
            List<SyncTarget> toSync = new ArrayList<>();
            for (GithubRepo repo : repos) {
                Room room = roomRepository.findById(repo.getRoomId()).orElse(null);
                if (room == null || !"build".equalsIgnoreCase(room.getStage())) {
                    continue;
                }

                if (repo.getLastSyncAt() != null && Duration.between(repo.getLastSyncAt(), now).toMinutes() < 5) {
                    continue;
                }

                repo.setLastSyncAt(now);
                repoRepository.save(repo);
                toSync.add(new SyncTarget(room, repo.getConnectedBy()));
            }
            return toSync;
        }).orElse(Collections.emptyList());

        int synced = 0;
        for (SyncTarget target : targets) {
            try {
                syncService.sync(target.room(), target.connectedBy());
                synced++;
                Thread.sleep(50); // Short pause between room syncs
            } catch (Exception e) {
                log.warn("Scheduled GitHub sync failed for room {}: {}", target.room().getId(), e.getMessage());
            }
        }
        return synced;
    }
}
