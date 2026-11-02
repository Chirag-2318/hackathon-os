package com.hackathonos.backend.mcp.oauth;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.mcp.McpToken;
import com.hackathonos.backend.mcp.McpTokenRepository;
import com.hackathonos.backend.mcp.McpTokenService;
import com.hackathonos.backend.mcp.oauth.dto.OAuthTokenResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MultiValueMap;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class OAuthTokenExchangeService {

    private static final Logger log = LoggerFactory.getLogger(OAuthTokenExchangeService.class);

    private final OAuthAuthCodeRepository authCodeRepository;
    private final McpTokenRepository mcpTokenRepository;
    private final McpTokenService mcpTokenService;
    private final AppProperties appProperties;

    public OAuthTokenExchangeService(
            OAuthAuthCodeRepository authCodeRepository,
            McpTokenRepository mcpTokenRepository,
            McpTokenService mcpTokenService,
            AppProperties appProperties
    ) {
        this.authCodeRepository = authCodeRepository;
        this.mcpTokenRepository = mcpTokenRepository;
        this.mcpTokenService = mcpTokenService;
        this.appProperties = appProperties;
    }

    @Transactional(noRollbackFor = OAuthExceptions.TokenException.class)
    public OAuthTokenResponse exchangeToken(MultiValueMap<String, String> form) {
        String grantType = form.getFirst("grant_type");
        if (grantType == null || grantType.isBlank()) {
            throw new OAuthExceptions.TokenException(400, "invalid_request", "Missing grant_type");
        }

        if ("authorization_code".equals(grantType)) {
            return exchangeAuthorizationCode(form);
        } else if ("refresh_token".equals(grantType)) {
            return exchangeRefreshToken(form);
        } else {
            throw new OAuthExceptions.TokenException(400, "unsupported_grant_type", "Unsupported grant_type: " + grantType);
        }
    }

    private OAuthTokenResponse exchangeAuthorizationCode(MultiValueMap<String, String> form) {
        String code = form.getFirst("code");
        String clientId = form.getFirst("client_id");
        String redirectUri = form.getFirst("redirect_uri");
        String codeVerifier = form.getFirst("code_verifier");

        if (code == null || code.isBlank() || clientId == null || clientId.isBlank()
                || redirectUri == null || redirectUri.isBlank() || codeVerifier == null || codeVerifier.isBlank()) {
            throw new OAuthExceptions.TokenException(400, "invalid_request", "Missing required authorization code exchange parameter");
        }

        String codeHash = McpTokenService.hashToken(code);
        OAuthAuthCode authCode = authCodeRepository.findByCodeHash(codeHash)
                .orElseThrow(() -> new OAuthExceptions.TokenException(400, "invalid_grant", "Invalid or unknown authorization code"));

        if (authCode.getUsedAt() != null) {
            log.warn("Auth code reuse detected for hash={}. Revoking all tokens issued from it.", codeHash.substring(0, 8) + "...");
            mcpTokenRepository.revokeByAuthCodeHash(codeHash, Instant.now());
            throw new OAuthExceptions.TokenException(400, "invalid_grant", "Authorization code has already been used");
        }

        if (authCode.getExpiresAt().isBefore(Instant.now())) {
            throw new OAuthExceptions.TokenException(400, "invalid_grant", "Authorization code has expired");
        }
        if (!authCode.getClientId().equals(clientId)) {
            throw new OAuthExceptions.TokenException(400, "invalid_grant", "client_id mismatch");
        }
        if (!authCode.getRedirectUri().equals(redirectUri)) {
            throw new OAuthExceptions.TokenException(400, "invalid_grant", "redirect_uri mismatch");
        }

        if (!verifyPkceS256(codeVerifier, authCode.getCodeChallenge())) {
            throw new OAuthExceptions.TokenException(400, "invalid_grant", "Invalid code_verifier");
        }

        authCode.setUsedAt(Instant.now());
        authCodeRepository.save(authCode);

        UUID familyId = UUID.randomUUID();
        Duration accessTtl = appProperties.getMcp().getOauth().getAccessTokenTtl();
        Duration refreshTtl = appProperties.getMcp().getOauth().getRefreshTokenTtl();
        String effectiveScope = authCode.getScope() != null ? authCode.getScope() : "mcp";

        String rawAccessToken = mcpTokenService.generateRawToken();
        McpToken accessToken = new McpToken(authCode.getUserId(), McpTokenService.hashToken(rawAccessToken),
                "ACCESS", clientId, effectiveScope, Instant.now().plus(accessTtl), familyId, codeHash);
        mcpTokenRepository.save(accessToken);

        String rawRefreshToken = mcpTokenService.generateRawToken();
        McpToken refreshToken = new McpToken(authCode.getUserId(), McpTokenService.hashToken(rawRefreshToken),
                "REFRESH", clientId, effectiveScope, Instant.now().plus(refreshTtl), familyId, codeHash);
        mcpTokenRepository.save(refreshToken);

        return new OAuthTokenResponse(rawAccessToken, "Bearer", accessTtl.toSeconds(), rawRefreshToken, effectiveScope);
    }

    private OAuthTokenResponse exchangeRefreshToken(MultiValueMap<String, String> form) {
        String rawRefreshToken = form.getFirst("refresh_token");
        String clientId = form.getFirst("client_id");

        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new OAuthExceptions.TokenException(400, "invalid_request", "Missing refresh_token");
        }

        String hash = McpTokenService.hashToken(rawRefreshToken);
        McpToken token = mcpTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new OAuthExceptions.TokenException(400, "invalid_grant", "Invalid refresh token"));

        if (!"REFRESH".equals(token.getKind())) {
            throw new OAuthExceptions.TokenException(400, "invalid_grant", "Token is not a refresh token");
        }

        if (token.getRotatedAt() != null) {
            log.warn("Replay of rotated refresh token detected for familyId={}. Revoking family.", token.getFamilyId());
            if (token.getFamilyId() != null) {
                mcpTokenRepository.revokeFamily(token.getFamilyId(), Instant.now());
            }
            throw new OAuthExceptions.TokenException(400, "invalid_grant", "Refresh token has already been rotated and revoked");
        }

        if (token.getRevokedAt() != null) {
            throw new OAuthExceptions.TokenException(400, "invalid_grant", "Refresh token has been revoked");
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new OAuthExceptions.TokenException(400, "invalid_grant", "Refresh token has expired");
        }
        if (clientId != null && !clientId.isBlank() && token.getClientId() != null && !token.getClientId().equals(clientId)) {
            throw new OAuthExceptions.TokenException(400, "invalid_grant", "client_id mismatch");
        }

        token.setRotatedAt(Instant.now());
        token.setRevokedAt(Instant.now());
        mcpTokenRepository.save(token);

        Duration accessTtl = appProperties.getMcp().getOauth().getAccessTokenTtl();
        Duration refreshTtl = appProperties.getMcp().getOauth().getRefreshTokenTtl();
        UUID familyId = token.getFamilyId() != null ? token.getFamilyId() : UUID.randomUUID();

        String newRawAccessToken = mcpTokenService.generateRawToken();
        McpToken newAccessToken = new McpToken(token.getUserId(), McpTokenService.hashToken(newRawAccessToken),
                "ACCESS", token.getClientId(), token.getScope(), Instant.now().plus(accessTtl), familyId, token.getAuthCodeHash());
        mcpTokenRepository.save(newAccessToken);

        String newRawRefreshToken = mcpTokenService.generateRawToken();
        McpToken newRefreshToken = new McpToken(token.getUserId(), McpTokenService.hashToken(newRawRefreshToken),
                "REFRESH", token.getClientId(), token.getScope(), Instant.now().plus(refreshTtl), familyId, token.getAuthCodeHash());
        mcpTokenRepository.save(newRefreshToken);

        return new OAuthTokenResponse(newRawAccessToken, "Bearer", accessTtl.toSeconds(), newRawRefreshToken, token.getScope());
    }

    public static boolean verifyPkceS256(String codeVerifier, String codeChallenge) {
        if (codeVerifier == null || codeChallenge == null) return false;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
            String computed = Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
            return MessageDigest.isEqual(computed.getBytes(StandardCharsets.UTF_8), codeChallenge.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional
    public void revokeToken(String token, String tokenTypeHint) {
        if (token == null || token.isBlank()) return;
        String hash = McpTokenService.hashToken(token);
        mcpTokenRepository.findByTokenHash(hash).ifPresent(t -> {
            if (t.getRevokedAt() == null) {
                t.setRevokedAt(Instant.now());
                mcpTokenRepository.save(t);
                log.info("Revoked OAuth token id={} kind={}", t.getId(), t.getKind());
            }
        });
    }
}
