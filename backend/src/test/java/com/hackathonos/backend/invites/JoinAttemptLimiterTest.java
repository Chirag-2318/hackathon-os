package com.hackathonos.backend.invites;

import com.hackathonos.backend.common.error.TooManyRequestsException;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JoinAttemptLimiterTest {

    @Test
    void testThrottleLimitAfter10Attempts() {
        JoinAttemptLimiter limiter = new JoinAttemptLimiter();
        UUID userId = UUID.randomUUID();

        // 10 attempts should succeed
        for (int i = 0; i < 10; i++) {
            assertThatCode(() -> limiter.checkAndRecord(userId)).doesNotThrowAnyException();
        }

        // 11th attempt must throw TooManyRequestsException
        assertThatThrownBy(() -> limiter.checkAndRecord(userId))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessageContaining("Too many join attempts");
    }

    @Test
    void testClearResetsCounter() {
        JoinAttemptLimiter limiter = new JoinAttemptLimiter();
        UUID userId = UUID.randomUUID();

        for (int i = 0; i < 10; i++) {
            limiter.checkAndRecord(userId);
        }

        limiter.clear(userId);

        // After clear, attempts should be allowed again
        assertThatCode(() -> limiter.checkAndRecord(userId)).doesNotThrowAnyException();
    }
}
