package com.hackathonos.backend.common.jobs;

import com.hackathonos.backend.common.security.OAuthLinkStateService;
import com.hackathonos.backend.reminders.DeadlineReminderJob;
import com.hackathonos.backend.submission.SubmissionLinkCheckJob;
import com.hackathonos.backend.users.DataRetentionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThatCode;

@SpringBootTest
@ActiveProfiles("dev")
class ScheduledCleanupJobsIntegrationTest {

    @Autowired
    private CleanupJob cleanupJob;

    @Autowired
    private SubmissionLinkCheckJob submissionLinkCheckJob;

    @Autowired
    private DeadlineReminderJob deadlineReminderJob;

    @Autowired
    private DataRetentionService dataRetentionService;

    @Autowired(required = false)
    private OAuthLinkStateService oAuthLinkStateService;

    @Test
    @DisplayName("Invoke every background cleanup and prune method against migrated database schema without SQL error")
    void testAllScheduledCleanupMethodsExecuteWithoutSqlError() {
        // 1. Hourly idempotency prune
        assertThatCode(() -> cleanupJob.doIdempotencyPrune())
                .doesNotThrowAnyException();

        // 2. Hourly realtime prune (room_events & room_presence)
        assertThatCode(() -> cleanupJob.doRealtimePrune())
                .doesNotThrowAnyException();

        // 3. Nightly maintenance cleanup (invites, notifications, data_exports, client_errors, link_states)
        assertThatCode(() -> cleanupJob.doCleanup())
                .doesNotThrowAnyException();

        // 4. Stale submission link checker
        assertThatCode(() -> submissionLinkCheckJob.checkStaleLinks())
                .doesNotThrowAnyException();

        // 5. Deadline reminders job
        assertThatCode(() -> deadlineReminderJob.runReminders())
                .doesNotThrowAnyException();

        // 6. User data retention cleanup
        assertThatCode(() -> dataRetentionService.doRetentionCleanup())
                .doesNotThrowAnyException();

        // 7. OAuth link state expired cleanup
        if (oAuthLinkStateService != null) {
            assertThatCode(() -> oAuthLinkStateService.cleanExpiredStates())
                    .doesNotThrowAnyException();
        }
    }
}

