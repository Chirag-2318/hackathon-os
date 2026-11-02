package com.hackathonos.backend.submission;

import com.hackathonos.backend.common.http.SafeHttpClient;
import com.hackathonos.backend.common.lock.DbAdvisoryLockService;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Background job that re-checks external submission links every 30 minutes.
 * Uses a short transaction-scoped lock to claim candidate links, then executes
 * outbound HTTP HEAD/GET checks without holding any pooled DB connections.
 */
@Component
@ConditionalOnProperty(name = "app.jobs.submission-link-check.enabled", havingValue = "true", matchIfMissing = true)
public class SubmissionLinkCheckJob {

    private static final Logger log = LoggerFactory.getLogger(SubmissionLinkCheckJob.class);

    private final SubmissionLinkRepository linkRepository;
    private final SubmissionRepository submissionRepository;
    private final RoomRepository roomRepository;
    private final SafeHttpClient safeHttpClient;
    private final DbAdvisoryLockService advisoryLockService;
    private final TransactionTemplate transactionTemplate;

    public SubmissionLinkCheckJob(
            SubmissionLinkRepository linkRepository,
            SubmissionRepository submissionRepository,
            RoomRepository roomRepository,
            SafeHttpClient safeHttpClient,
            DbAdvisoryLockService advisoryLockService,
            TransactionTemplate transactionTemplate
    ) {
        this.linkRepository = linkRepository;
        this.submissionRepository = submissionRepository;
        this.roomRepository = roomRepository;
        this.safeHttpClient = safeHttpClient;
        this.advisoryLockService = advisoryLockService;
        this.transactionTemplate = transactionTemplate;
    }

    @Scheduled(fixedDelayString = "${app.jobs.submission-link-check.fixed-delay-ms:1800000}")
    public void run() {
        checkStaleLinks();
    }

    public void doCheckStaleLinks() {
        checkStaleLinks();
    }

    public record ClaimedLink(UUID id, String url) {}

    public int checkStaleLinks() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(30));

        // 1. Claim links inside a short transaction using transaction advisory lock
        List<ClaimedLink> claimed = advisoryLockService.tryXactLockAndClaim(1006L, () -> {
            List<Submission> drafts = submissionRepository.findAll().stream()
                    .filter(s -> "DRAFT".equalsIgnoreCase(s.getStatus()))
                    .toList();

            List<ClaimedLink> items = new ArrayList<>();
            for (Submission sub : drafts) {
                Room room = roomRepository.findById(sub.getRoomId()).orElse(null);
                if (room == null || !"BUILD".equalsIgnoreCase(room.getStage())) {
                    continue;
                }

                List<SubmissionLink> links = linkRepository.findByRoomIdOrderByLabelAsc(sub.getRoomId());
                for (SubmissionLink link : links) {
                    if (link.getLastCheckedAt() == null || link.getLastCheckedAt().isBefore(cutoff)) {
                        link.setLastCheckedAt(Instant.now());
                        linkRepository.save(link);
                        items.add(new ClaimedLink(link.getId(), link.getUrl()));
                    }
                }
            }
            return items;
        }).orElse(Collections.emptyList());

        if (claimed.isEmpty()) {
            return 0;
        }

        // 2. Perform slow HTTP checks outside any transaction or connection
        int checked = 0;
        for (ClaimedLink cl : claimed) {
            SafeHttpClient.SafeHttpResponse result = safeHttpClient.headOrGet(cl.url(), 5000);
            transactionTemplate.execute(status -> {
                linkRepository.findById(cl.id()).ifPresent(link -> {
                    link.setOk(result.ok());
                    link.setHttpStatus(result.httpStatus());
                    link.setLastCheckedAt(Instant.now());
                    linkRepository.save(link);
                });
                return null;
            });
            checked++;
        }

        if (checked > 0) {
            log.info("Checked {} stale submission links", checked);
        }
        return checked;
    }
}
