package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class OAuthLinkStateService {

    private static final Logger log = LoggerFactory.getLogger(OAuthLinkStateService.class);
    private static final Duration DEFAULT_EXPIRY = Duration.ofMinutes(10);

    private final OAuthLinkStateRepository repository;
    private final AppProperties appProperties;

    public OAuthLinkStateService(OAuthLinkStateRepository repository, AppProperties appProperties) {
        this.repository = repository;
        this.appProperties = appProperties;
    }

    @Transactional
    public OAuthLinkState createLinkState(String provider, UUID userId, UUID roomId, String codeVerifier, String returnPath) {
        String state = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(DEFAULT_EXPIRY);
        OAuthLinkState linkState = new OAuthLinkState(state, provider, userId, roomId, codeVerifier, returnPath, expiresAt);
        return repository.save(linkState);
    }

    /**
     * Validates and atomically consumes a single-use OAuth link state.
     * Rejects missing, expired, mismatched provider, or already-used states.
     * Optionally validates currentUser matches the state initiator if present.
     */
    @Transactional
    public OAuthLinkState consumeState(String state, String provider, UUID currentUserId) {
        if (state == null || state.isBlank()) {
            throw new BadRequestException("STATE_MISMATCH", "Missing state parameter");
        }

        Optional<OAuthLinkState> stateOpt = repository.findByStateAndProvider(state, provider);
        if (stateOpt.isEmpty()) {
            log.warn("OAuth link state not found: provider={}, state={}", provider, state);
            throw new BadRequestException("STATE_MISMATCH", "Invalid or unknown state parameter");
        }

        OAuthLinkState linkState = stateOpt.get();
        if (linkState.getUsedAt() != null) {
            log.warn("OAuth link state already used: provider={}, state={}", provider, state);
            throw new BadRequestException("STATE_ALREADY_USED", "OAuth link state has already been used");
        }

        if (linkState.getExpiresAt().isBefore(Instant.now())) {
            log.warn("OAuth link state expired: provider={}, state={}", provider, state);
            throw new BadRequestException("STATE_EXPIRED", "OAuth link state has expired");
        }

        if (currentUserId != null && !currentUserId.equals(linkState.getUserId())) {
            log.warn("OAuth link state user mismatch: expected={}, actual={}", linkState.getUserId(), currentUserId);
            throw new BadRequestException("USER_MISMATCH", "Logged-in user does not match the link session");
        }

        linkState.setUsedAt(Instant.now());
        return repository.save(linkState);
    }

    /**
     * Builds public redirect_uri using public frontend origin (APP_PUBLIC_URL)
     * as proxied by Vercel, or falls back to backend host on localhost/dev.
     */
    public String buildRedirectUri(String callbackPath) {
        String publicUrl = appProperties.getPublicUrl();
        if (publicUrl != null && !publicUrl.isBlank() && !publicUrl.contains("localhost") && !publicUrl.contains("127.0.0.1")) {
            while (publicUrl.endsWith("/")) publicUrl = publicUrl.substring(0, publicUrl.length() - 1);
            return publicUrl + (callbackPath.startsWith("/") ? callbackPath : "/" + callbackPath);
        }

        String baseUrl = appProperties.getBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) baseUrl = "http://localhost:8080";
        while (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        return baseUrl + (callbackPath.startsWith("/") ? callbackPath : "/" + callbackPath);
    }

    public int cleanExpiredStates() {
        Instant cutoff = Instant.now();
        Instant usedCutoff = cutoff.minus(Duration.ofHours(24));
        return repository.purgeExpiredStates(cutoff, usedCutoff);
    }
}

