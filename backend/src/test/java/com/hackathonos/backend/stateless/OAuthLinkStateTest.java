package com.hackathonos.backend.stateless;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.security.OAuthLinkState;
import com.hackathonos.backend.common.security.OAuthLinkStateRepository;
import com.hackathonos.backend.common.security.OAuthLinkStateService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class OAuthLinkStateTest {

    @Autowired
    private OAuthLinkStateService linkStateService;

    @Autowired
    private OAuthLinkStateRepository repository;

    @Autowired
    private AppProperties appProperties;

    @Test
    @DisplayName("OAuth link state creation, single-use consumption, and replay rejection")
    void testLinkStateLifecycle() {
        UUID userId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();

        // 1. Create state
        OAuthLinkState created = linkStateService.createLinkState(
                "GITHUB",
                userId,
                roomId,
                "verifier123",
                "/app/room/" + roomId + "/github"
        );

        assertThat(created.getState()).isNotBlank();
        assertThat(created.getExpiresAt()).isAfter(Instant.now());
        assertThat(created.getUsedAt()).isNull();

        // 2. Consume state successfully
        OAuthLinkState consumed = linkStateService.consumeState(created.getState(), "GITHUB", userId);
        assertThat(consumed.getUsedAt()).isNotNull();
        assertThat(consumed.getRoomId()).isEqualTo(roomId);
        assertThat(consumed.getCodeVerifier()).isEqualTo("verifier123");

        // 3. Second consumption must fail with STATE_ALREADY_USED
        assertThatThrownBy(() -> linkStateService.consumeState(created.getState(), "GITHUB", userId))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already been used");
    }

    @Test
    @DisplayName("OAuth link state rejects expired states")
    void testExpiredStateRejected() {
        UUID userId = UUID.randomUUID();
        OAuthLinkState expired = new OAuthLinkState(
                UUID.randomUUID().toString(),
                "CANVA",
                userId,
                null,
                "verifier",
                "/app/rooms",
                Instant.now().minus(5, ChronoUnit.MINUTES) // Already expired
        );
        repository.save(expired);

        assertThatThrownBy(() -> linkStateService.consumeState(expired.getState(), "CANVA", userId))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("OAuth link state rejects user mismatch when session user is present")
    void testUserMismatchRejected() {
        UUID originalUser = UUID.randomUUID();
        UUID differentUser = UUID.randomUUID();

        OAuthLinkState created = linkStateService.createLinkState(
                "GITHUB",
                originalUser,
                null,
                null,
                "/app/settings/integrations"
        );

        assertThatThrownBy(() -> linkStateService.consumeState(created.getState(), "GITHUB", differentUser))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("does not match");
    }

    @Test
    @DisplayName("buildRedirectUri respects public frontend origin on production and localhost in dev")
    void testRedirectUriGeneration() {
        // Dev / localhost default
        String devUri = linkStateService.buildRedirectUri("/api/v1/github/link/callback");
        assertThat(devUri).contains("/api/v1/github/link/callback");

        // When publicUrl is set to a Vercel production domain
        String origPublicUrl = appProperties.getPublicUrl();
        try {
            appProperties.setPublicUrl("https://brackit-app.vercel.app");
            String prodUri = linkStateService.buildRedirectUri("/api/v1/github/link/callback");
            assertThat(prodUri).isEqualTo("https://brackit-app.vercel.app/api/v1/github/link/callback");
        } finally {
            appProperties.setPublicUrl(origPublicUrl);
        }
    }

    @Test
    @DisplayName("cleanExpiredStates removes expired and old used states")
    void testCleanExpiredStates() {
        OAuthLinkState stale = new OAuthLinkState(
                UUID.randomUUID().toString(),
                "GITHUB",
                UUID.randomUUID(),
                null,
                null,
                null,
                Instant.now().minus(2, ChronoUnit.HOURS)
        );
        repository.save(stale);

        int purged = linkStateService.cleanExpiredStates();
        assertThat(purged).isGreaterThanOrEqualTo(1);
        assertThat(repository.findById(stale.getState())).isEmpty();
    }
}

