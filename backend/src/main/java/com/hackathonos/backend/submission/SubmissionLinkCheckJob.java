package com.hackathonos.backend.submission;

import com.hackathonos.backend.common.http.SafeHttpClient;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Background job that re-checks external submission links every 30 minutes.
 */
@Component
@ConditionalOnProperty(name = "app.jobs.submission-link-check.enabled", havingValue = "true", matchIfMissing = true)
public class SubmissionLinkCheckJob {

    private static final Logger log = LoggerFactory.getLogger(SubmissionLinkCheckJob.class);

    private final SubmissionLinkRepository linkRepository;
    private final SubmissionRepository submissionRepository;
    private final RoomRepository roomRepository;
    private final SafeHttpClient safeHttpClient;
    private final com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService;

    public SubmissionLinkCheckJob(
            SubmissionLinkRepository linkRepository,
            SubmissionRepository submissionRepository,
            RoomRepository roomRepository,
            SafeHttpClient safeHttpClient,
            com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService
    ) {
        this.linkRepository = linkRepository;
        this.submissionRepository = submissionRepository;
        this.roomRepository = roomRepository;
        this.safeHttpClient = safeHttpClient;
        this.advisoryLockService = advisoryLockService;
    }

    @Scheduled(fixedDelayString = "${app.jobs.submission-link-check.fixed-delay-ms:1800000}")
    public void run() {
        advisoryLockService.tryLockAndRun(1006L, this::doCheckStaleLinks);
    }

    @Transactional
    public void doCheckStaleLinks() {
        checkStaleLinks();
    }

    public int checkStaleLinks() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(30));
        List<Submission> drafts = submissionRepository.findAll().stream()
                .filter(s -> "DRAFT".equalsIgnoreCase(s.getStatus()))
                .toList();

        int checked = 0;
        for (Submission sub : drafts) {
            Room room = roomRepository.findById(sub.getRoomId()).orElse(null);
            if (room == null || !"BUILD".equalsIgnoreCase(room.getStage())) {
                continue;
            }

            List<SubmissionLink> links = linkRepository.findByRoomIdOrderByLabelAsc(sub.getRoomId());
            for (SubmissionLink link : links) {
                if (link.getLastCheckedAt() == null || link.getLastCheckedAt().isBefore(cutoff)) {
                    SafeHttpClient.SafeHttpResponse result = safeHttpClient.headOrGet(link.getUrl(), 5000);
                    link.setOk(result.ok());
                    link.setHttpStatus(result.httpStatus());
                    link.setLastCheckedAt(Instant.now());
                    linkRepository.save(link);
                    checked++;
                }
            }
        }
        if (checked > 0) {
            log.info("Checked {} stale submission links", checked);
        }
        return checked;
    }
}
