package com.hackathonos.backend.overview.attention.rules;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.github.GithubAttentionDismissal;
import com.hackathonos.backend.github.GithubAttentionDismissalRepository;
import com.hackathonos.backend.overview.attention.AttentionItem;
import com.hackathonos.backend.overview.attention.AttentionRule;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.submission.SubmissionRepository;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Component
public class SubmissionRiskRule implements AttentionRule {

    private final SubmissionRepository submissionRepository;
    private final GithubAttentionDismissalRepository dismissalRepository;
    private final CurrentUser currentUser;
    private final Clock clock;

    public SubmissionRiskRule(SubmissionRepository submissionRepository,
                              GithubAttentionDismissalRepository dismissalRepository,
                              CurrentUser currentUser,
                              Clock clock) {
        this.submissionRepository = submissionRepository;
        this.dismissalRepository = dismissalRepository;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        if (room.getEventEnd() == null) return Collections.emptyList();

        User current = currentUser.get();
        if (current != null && dismissalRepository.existsById(new GithubAttentionDismissal.GithubAttentionDismissalId(room.getId(), "submission_risk", current.getId()))) {
            return Collections.emptyList();
        }

        Instant now = clock.instant();
        Duration timeLeft = Duration.between(now, room.getEventEnd());
        long hoursLeft = timeLeft.toHours();

        if (hoursLeft <= 3 && !timeLeft.isNegative()) {
            boolean isVerified = submissionRepository.findById(room.getId())
                    .map(s -> "VERIFIED".equalsIgnoreCase(s.getStatus()) || "SUBMITTED".equalsIgnoreCase(s.getStatus()))
                    .orElse(false);

            if (!isVerified) {
                String severity = hoursLeft < 1 ? "red" : "amber";
                String title = hoursLeft < 1 ? "Critical: Under 1 hour to submission deadline" : "Submission not verified (" + hoursLeft + "h left)";
                return List.of(new AttentionItem(
                        "submission_risk",
                        "submission_risk",
                        severity,
                        title,
                        "Verify links, requirements, and drafts before time runs out.",
                        "Verify now",
                        "/app/room/" + room.getId() + "/submission",
                        List.of()
                ));
            }
        }
        return Collections.emptyList();
    }
}
