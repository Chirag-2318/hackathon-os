package com.hackathonos.backend.mcp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class McpTokenService {

    private static final Logger log = LoggerFactory.getLogger(McpTokenService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    public static final String TOKEN_PREFIX = "bkt_";

    private final McpTokenRepository mcpTokenRepository;

    public McpTokenService(McpTokenRepository mcpTokenRepository) {
        this.mcpTokenRepository = mcpTokenRepository;
    }

    /**
     * Generates a raw token matching format: "bkt_" + 32 random bytes base64url encoded.
     */
    public String generateRawToken() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        return TOKEN_PREFIX + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /**
     * Computes the SHA-256 hex digest of a raw token.
     */
    public static String hashToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return "";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    public record GeneratedToken(String rawToken, McpToken tokenEntity) {}

    /**
     * Creates an ACCESS token for the specified user and saves only the SHA-256 hash.
     * Never logs the raw token.
     */
    @Transactional
    public GeneratedToken createAccessToken(UUID userId, Duration validity, String clientId, String scope) {
        String rawToken = generateRawToken();
        String hash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(validity);
        String effectiveScope = (scope != null && !scope.isBlank()) ? scope : "mcp";

        McpToken token = new McpToken(userId, hash, "ACCESS", clientId, effectiveScope, expiresAt);
        McpToken saved = mcpTokenRepository.save(token);
        log.info("Created MCP access token id={} for userId={} expiresAt={}", saved.getId(), userId, expiresAt);

        return new GeneratedToken(rawToken, saved);
    }

    /**
     * Looks up and validates a token from its raw bearer value.
     */
    @Transactional
    public Optional<McpToken> validateAndRecordUsage(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }
        String hash = hashToken(rawToken);
        Optional<McpToken> tokenOpt = mcpTokenRepository.findByTokenHash(hash);
        if (tokenOpt.isEmpty()) {
            return Optional.empty();
        }

        McpToken token = tokenOpt.get();
        if (token.getRevokedAt() != null) {
            log.debug("MCP token id={} is revoked", token.getId());
            return Optional.empty();
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            log.debug("MCP token id={} is expired", token.getId());
            return Optional.empty();
        }

        token.setLastUsedAt(Instant.now());
        mcpTokenRepository.save(token);
        return Optional.of(token);
    }
}
