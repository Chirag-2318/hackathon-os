package com.hackathonos.backend.mcp.oauth;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.mcp.McpTokenService;
import com.hackathonos.backend.mcp.oauth.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MultiValueMap;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class OAuthServerService {

    private static final Logger log = LoggerFactory.getLogger(OAuthServerService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int MAX_TOTAL_CLIENTS = 5000;

    private final OAuthClientRepository clientRepository;
    private final OAuthAuthCodeRepository authCodeRepository;
    private final OAuthTokenExchangeService tokenExchangeService;
    private final AppProperties appProperties;
    private final OAuthRateLimiter rateLimiter;
    private final Environment environment;

    public OAuthServerService(
            OAuthClientRepository clientRepository,
            OAuthAuthCodeRepository authCodeRepository,
            OAuthTokenExchangeService tokenExchangeService,
            AppProperties appProperties,
            OAuthRateLimiter rateLimiter,
            Environment environment
    ) {
        this.clientRepository = clientRepository;
        this.authCodeRepository = authCodeRepository;
        this.tokenExchangeService = tokenExchangeService;
        this.appProperties = appProperties;
        this.rateLimiter = rateLimiter;
        this.environment = environment;
    }

    public OAuthDiscoveryResponse getDiscoveryMetadata() {
        String issuer = appProperties.getOAuthIssuer();
        return new OAuthDiscoveryResponse(
                issuer,
                issuer + "/oauth/authorize",
                issuer + "/oauth/token",
                issuer + "/oauth/register",
                issuer + "/oauth/revoke",
                List.of("code"),
                List.of("authorization_code", "refresh_token"),
                List.of("S256"),
                List.of("none"),
                List.of("mcp", "offline_access")
        );
    }

    @Transactional
    public OAuthRegisterResponse registerClient(OAuthRegisterRequest request, String clientIp) {
        if (!rateLimiter.allowRequest(clientIp)) {
            throw new OAuthExceptions.TokenException(429, "rate_limit_exceeded", "Too many client registration requests");
        }
        if (clientRepository.count() >= MAX_TOTAL_CLIENTS) {
            throw new OAuthExceptions.TokenException(400, "invalid_client_metadata", "Total client registration limit reached");
        }
        if (request == null || request.redirectUris() == null || request.redirectUris().isEmpty()) {
            throw new OAuthExceptions.TokenException(400, "invalid_redirect_uri", "redirect_uris is required and cannot be empty");
        }
        if (request.tokenEndpointAuthMethod() != null && !request.tokenEndpointAuthMethod().isBlank()
                && !"none".equalsIgnoreCase(request.tokenEndpointAuthMethod())) {
            throw new OAuthExceptions.TokenException(400, "invalid_client_metadata", "Only public clients (auth method 'none') are supported");
        }
        if (request.grantTypes() != null) {
            Set<String> supportedGrants = Set.of("authorization_code", "refresh_token");
            for (String g : request.grantTypes()) {
                if (!supportedGrants.contains(g)) {
                    throw new OAuthExceptions.TokenException(400, "invalid_client_metadata", "Unsupported grant_type: " + g);
                }
            }
        }
        if (request.responseTypes() != null) {
            Set<String> supportedResponses = Set.of("code");
            for (String r : request.responseTypes()) {
                if (!supportedResponses.contains(r)) {
                    throw new OAuthExceptions.TokenException(400, "invalid_client_metadata", "Unsupported response_type: " + r);
                }
            }
        }

        List<String> allowedUris = appProperties.getMcp().getOauth().getAllowedRedirectUris();
        boolean allowLoopback = appProperties.getMcp().getOauth().isAllowLoopbackRedirects();

        for (String uriStr : request.redirectUris()) {
            if (!isValidRegistrationUri(uriStr, allowedUris, allowLoopback)) {
                throw new OAuthExceptions.TokenException(400, "invalid_redirect_uri", "Redirect URI is not allowed: " + uriStr);
            }
        }

        String clientId = "bkt_client_" + UUID.randomUUID().toString().replace("-", "");
        String clientName = (request.clientName() != null && !request.clientName().isBlank())
                ? request.clientName().trim() : "Claude Connector";

        OAuthClient client = new OAuthClient(clientId, clientName, request.redirectUris());
        clientRepository.save(client);
        log.info("Registered dynamic OAuth client id={} name={}", clientId, clientName);

        List<String> effectiveGrants = request.grantTypes() != null && !request.grantTypes().isEmpty()
                ? request.grantTypes() : List.of("authorization_code", "refresh_token");
        List<String> effectiveResponses = request.responseTypes() != null && !request.responseTypes().isEmpty()
                ? request.responseTypes() : List.of("code");

        return new OAuthRegisterResponse(
                clientId,
                client.getCreatedAt().getEpochSecond(),
                clientName,
                request.redirectUris(),
                effectiveGrants,
                effectiveResponses,
                "none"
        );
    }

    public boolean isValidRegistrationUri(String uriStr, List<String> allowedUris, boolean allowLoopback) {
        if (uriStr == null || uriStr.isBlank()) return false;
        if (allowedUris != null && allowedUris.contains(uriStr)) {
            return true;
        }
        if (allowLoopback) {
            try {
                URI uri = URI.create(uriStr);
                if ("http".equalsIgnoreCase(uri.getScheme())) {
                    String host = uri.getHost();
                    return "localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host);
                }
            } catch (Exception ignored) {}
        }
        return false;
    }

    public OAuthClient validateClientAndRedirectUri(String clientId, String redirectUri) {
        if (clientId == null || clientId.isBlank()) {
            throw new OAuthExceptions.TerminalException("invalid_client", "Missing client_id parameter");
        }
        OAuthClient client = clientRepository.findById(clientId)
                .orElseThrow(() -> new OAuthExceptions.TerminalException("invalid_client", "Client not found"));

        if (redirectUri == null || redirectUri.isBlank()) {
            throw new OAuthExceptions.TerminalException("invalid_redirect_uri", "Missing redirect_uri parameter");
        }

        boolean matched = false;
        for (String reg : client.getRedirectUrisList()) {
            if (redirectUri.equals(reg)) {
                matched = true;
                break;
            }
            if (appProperties.getMcp().getOauth().isAllowLoopbackRedirects()) {
                try {
                    URI reqUri = URI.create(redirectUri);
                    URI regUri = URI.create(reg);
                    if ("http".equalsIgnoreCase(reqUri.getScheme()) && "http".equalsIgnoreCase(regUri.getScheme())) {
                        String reqHost = reqUri.getHost();
                        String regHost = regUri.getHost();
                        boolean isReqLoopback = "localhost".equalsIgnoreCase(reqHost) || "127.0.0.1".equals(reqHost);
                        boolean isRegLoopback = "localhost".equalsIgnoreCase(regHost) || "127.0.0.1".equals(regHost);
                        if (isReqLoopback && isRegLoopback) {
                            String reqPath = reqUri.getPath() != null ? reqUri.getPath() : "";
                            String regPath = regUri.getPath() != null ? regUri.getPath() : "";
                            if (reqPath.equals(regPath)) {
                                matched = true;
                                break;
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }
        }

        if (!matched) {
            throw new OAuthExceptions.TerminalException("invalid_redirect_uri", "Redirect URI does not match registered URIs");
        }
        return client;
    }

    public void validateAuthorizeParameters(OAuthClient client, String redirectUri, String state,
                                            String responseType, String codeChallenge,
                                            String codeChallengeMethod, String scope, String resource) {
        if (!"code".equals(responseType)) {
            throw new OAuthExceptions.RedirectException(redirectUri, state, "unsupported_response_type", "Only response_type=code is supported");
        }
        if (codeChallenge == null || codeChallenge.isBlank()) {
            throw new OAuthExceptions.RedirectException(redirectUri, state, "invalid_request", "code_challenge is required");
        }
        if (!"S256".equals(codeChallengeMethod)) {
            throw new OAuthExceptions.RedirectException(redirectUri, state, "invalid_request", "code_challenge_method must be S256");
        }
        if (scope != null && !scope.isBlank()) {
            Set<String> allowedScopes = Set.of("mcp", "offline_access");
            for (String s : scope.split("\\s+")) {
                if (!allowedScopes.contains(s)) {
                    throw new OAuthExceptions.RedirectException(redirectUri, state, "invalid_scope", "Unknown scope: " + s);
                }
            }
        }
        if (resource != null && !resource.isBlank()) {
            List<String> allowedResources = appProperties.getMcp().getOauth().getResourceUris();
            boolean isProd = environment.acceptsProfiles(Profiles.of("prod"));
            if (allowedResources != null && !allowedResources.isEmpty()) {
                if (!allowedResources.contains(resource)) {
                    throw new OAuthExceptions.RedirectException(redirectUri, state, "invalid_target_resource", "Requested resource URI is not allowed");
                }
            } else if (isProd) {
                throw new OAuthExceptions.RedirectException(redirectUri, state, "invalid_target_resource", "Resource validation required in production");
            }
        }
    }

    @Transactional
    public String createAuthorizationCode(String clientId, UUID userId, String redirectUri,
                                          String codeChallenge, String scope, String resource) {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        String rawCode = "bkt_code_" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        String codeHash = McpTokenService.hashToken(rawCode);
        Instant expiresAt = Instant.now().plus(appProperties.getMcp().getOauth().getAuthCodeTtl());

        OAuthAuthCode authCode = new OAuthAuthCode(codeHash, clientId, userId, redirectUri,
                codeChallenge, scope, resource, expiresAt);
        authCodeRepository.save(authCode);

        clientRepository.findById(clientId).ifPresent(c -> {
            c.setLastUsedAt(Instant.now());
            clientRepository.save(c);
        });

        log.info("Issued OAuth auth code hash={} for clientId={} userId={}", codeHash.substring(0, 8) + "...", clientId, userId);
        return rawCode;
    }

    public OAuthTokenResponse exchangeToken(MultiValueMap<String, String> form) {
        return tokenExchangeService.exchangeToken(form);
    }

    public static boolean verifyPkceS256(String codeVerifier, String codeChallenge) {
        return OAuthTokenExchangeService.verifyPkceS256(codeVerifier, codeChallenge);
    }

    public void revokeToken(String token, String tokenTypeHint) {
        tokenExchangeService.revokeToken(token, tokenTypeHint);
    }

    @Scheduled(fixedDelay = 86400000)
    @Transactional
    public void cleanupUnusedClientsAndExpiredCodes() {
        try {
            Instant clientCutoff = Instant.now().minus(Duration.ofDays(7));
            int deletedClients = clientRepository.deleteUnusedClientsOlderThan(clientCutoff);
            Instant codeCutoff = Instant.now().minus(Duration.ofDays(1));
            int deletedCodes = authCodeRepository.deleteExpiredCodesOlderThan(codeCutoff);
            log.info("Scheduled cleanup: purged {} unused clients and {} expired auth codes", deletedClients, deletedCodes);
        } catch (Exception e) {
            log.warn("OAuth cleanup encountered error: {}", e.getMessage());
        }
    }
}
