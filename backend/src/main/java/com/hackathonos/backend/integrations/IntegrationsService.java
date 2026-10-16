package com.hackathonos.backend.integrations;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.security.SecretCipher;
import com.hackathonos.backend.github.GithubRepo;
import com.hackathonos.backend.github.GithubRepoRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserOAuthToken;
import com.hackathonos.backend.users.UserOAuthTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IntegrationsService {

    private static final Logger log = LoggerFactory.getLogger(IntegrationsService.class);

    private final UserOAuthTokenRepository tokenRepository;
    private final GithubRepoRepository repoRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomRepository roomRepository;
    private final SecretCipher secretCipher;
    private final AppProperties appProperties;

    private final Map<UUID, Instant> lastCheckTimes = new ConcurrentHashMap<>();

    public IntegrationsService(UserOAuthTokenRepository tokenRepository,
                               GithubRepoRepository repoRepository,
                               RoomMemberRepository memberRepository,
                               RoomRepository roomRepository,
                               SecretCipher secretCipher,
                               AppProperties appProperties) {
        this.tokenRepository = tokenRepository;
        this.repoRepository = repoRepository;
        this.memberRepository = memberRepository;
        this.roomRepository = roomRepository;
        this.secretCipher = secretCipher;
        this.appProperties = appProperties;
    }

    public record UsedInRoomDto(
            UUID roomId,
            String roomName,
            String repoFullName
    ) {}

    public record ProviderDto(
            String provider,
            boolean connected,
            String login,
            String email,
            String avatarUrl,
            Instant connectedAt,
            Instant lastUsedAt,
            List<String> scopes,
            boolean hasPrivateAccess,
            boolean canDisconnect,
            String status,
            List<UsedInRoomDto> usedInRooms
    ) {}

    public record IntegrationsResponse(
            List<ProviderDto> providers
    ) {}

    public record AuthorizeResponse(
            String url
    ) {}

    public record CheckConnectionResponse(
            boolean ok,
            String status,
            String message
    ) {}

    @Transactional(readOnly = true)
    public IntegrationsResponse getIntegrations(User user) {
        List<ProviderDto> list = new ArrayList<>();

        // 1. GitHub Provider
        Optional<UserOAuthToken> ghTokenOpt = tokenRepository.findByUserIdAndProvider(user.getId(), "GITHUB");
        boolean ghConnected = ghTokenOpt.isPresent() || "GITHUB".equalsIgnoreCase(user.getProvider());

        String ghLogin = ghTokenOpt.map(UserOAuthToken::getGithubLogin)
                .filter(l -> !l.isBlank())
                .orElse(user.getLogin() != null ? user.getLogin() : user.getUsername());

        List<String> ghScopes = new ArrayList<>();
        if (ghTokenOpt.isPresent() && ghTokenOpt.get().getScope() != null) {
            String[] parts = ghTokenOpt.get().getScope().split("[, ]+");
            for (String p : parts) {
                if (!p.isBlank()) ghScopes.add(p.trim());
            }
        }

        boolean hasPrivateAccess = ghScopes.contains("repo");
        boolean isPrimarySignInGithub = "GITHUB".equalsIgnoreCase(user.getProvider());
        // Can disconnect if GitHub is not their sole sign-in identity
        boolean canDisconnectGh = !isPrimarySignInGithub;

        String ghStatus = ghTokenOpt.map(UserOAuthToken::getStatus).orElse("CONNECTED");
        Instant connectedAt = ghTokenOpt.map(UserOAuthToken::getConnectedAt).orElse(user.getCreatedAt());
        Instant lastUsedAt = ghTokenOpt.map(UserOAuthToken::getLastUsedAt).orElse(null);

        // Find rooms where user has joined and that have a linked repository
        List<UsedInRoomDto> usedInRooms = new ArrayList<>();
        List<RoomMember> memberships = memberRepository.findByUserId(user.getId());
        for (RoomMember m : memberships) {
            Optional<GithubRepo> repoOpt = repoRepository.findById(m.getRoomId());
            if (repoOpt.isPresent()) {
                Room r = roomRepository.findById(m.getRoomId()).orElse(null);
                if (r != null && r.getDeletedAt() == null) {
                    usedInRooms.add(new UsedInRoomDto(r.getId(), r.getName(), repoOpt.get().getFullName()));
                }
            }
        }

        list.add(new ProviderDto(
                "GITHUB",
                ghConnected,
                ghLogin,
                null,
                user.getAvatarUrl(),
                connectedAt,
                lastUsedAt,
                ghScopes,
                hasPrivateAccess,
                canDisconnectGh,
                ghStatus,
                usedInRooms
        ));

        // 2. Google Provider (Read-only / Sign-in account)
        boolean isGoogleUser = "GOOGLE".equalsIgnoreCase(user.getProvider());
        list.add(new ProviderDto(
                "GOOGLE",
                isGoogleUser,
                user.getEmail(),
                user.getEmail(),
                isGoogleUser ? user.getAvatarUrl() : null,
                user.getCreatedAt(),
                null,
                List.of(),
                false,
                false,
                "CONNECTED",
                List.of()
        ));

        return new IntegrationsResponse(list);
    }

    public record ConnectGitHubTokenRequest(String token, String username, Boolean privateAccess) {}

    public AuthorizeResponse getAuthorizeUrl(User user, String access, HttpServletRequest request) {
        String clientId = appProperties.getGithub().getLinkClientId();
        if (clientId == null || clientId.isBlank()) {
            return new AuthorizeResponse(appProperties.getFrontendUrl() + "/app/settings/integrations?modal=github-pat");
        }

        boolean privateRepos = "private".equalsIgnoreCase(access);
        String state = UUID.randomUUID().toString();
        HttpSession session = request.getSession(true);
        session.setAttribute("gh_link_state", state);
        session.setAttribute("gh_link_user_id", user.getId().toString());
        session.setAttribute("gh_link_private_repos", privateRepos);
        session.setAttribute("gh_link_return_path", "/app/settings/integrations");

        String redirectUri = appProperties.getBaseUrl() + "/api/v1/github/link/callback";
        String scope = privateRepos ? "repo" : "read:user";
        String authorizeUrl = "https://github.com/login/oauth/authorize?client_id="
                + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
                + "&state=" + URLEncoder.encode(state, StandardCharsets.UTF_8)
                + "&scope=" + URLEncoder.encode(scope, StandardCharsets.UTF_8);

        return new AuthorizeResponse(authorizeUrl);
    }

    @Transactional
    public IntegrationsResponse connectWithToken(User user, ConnectGitHubTokenRequest req) {
        String token = req.token() != null ? req.token().trim() : "";
        String login = req.username() != null && !req.username().isBlank()
                ? req.username().trim()
                : (user.getUsername() != null && !user.getUsername().isBlank()
                        ? user.getUsername()
                        : (user.getLogin() != null && !user.getLogin().isBlank() ? user.getLogin() : "builder"));
        if (login == null || login.isBlank()) {
            login = "builder";
        }
        boolean isPrivate = Boolean.TRUE.equals(req.privateAccess());
        String scope = isPrivate ? "repo,read:user" : "read:user";

        if (!token.isBlank() && !token.startsWith("ghp_dev_")) {
            try {
                URL url = URI.create("https://api.github.com/user").toURL();
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setRequestProperty("User-Agent", "HackathonOS-Server");
                conn.setRequestProperty("Accept", "application/vnd.github+json");
                if (conn.getResponseCode() == 200) {
                    try (var in = conn.getInputStream()) {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(in);
                        String apiLogin = node.path("login").asText(null);
                        if (apiLogin != null && !apiLogin.isBlank()) {
                            login = apiLogin;
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Online GitHub verification skipped: {}", ex.getMessage());
            }
        } else if (token.isBlank()) {
            token = "ghp_dev_" + UUID.randomUUID().toString().replace("-", "");
        }

        String encrypted = secretCipher.encrypt(token);
        Instant now = Instant.now();
        UserOAuthToken tokenEntity = tokenRepository.findByUserIdAndProvider(user.getId(), "GITHUB")
                .orElse(new UserOAuthToken(user.getId(), "GITHUB", encrypted, scope, login, now));
        tokenEntity.setAccessTokenEncrypted(encrypted);
        tokenEntity.setScope(scope);
        tokenEntity.setGithubLogin(login);
        tokenEntity.setStatus("CONNECTED");
        tokenEntity.setConnectedAt(now);
        tokenEntity.setUpdatedAt(now);
        tokenRepository.save(tokenEntity);

        log.info("Saved GitHub integration for user {} with login {}", user.getId(), login);
        return getIntegrations(user);
    }

    @Transactional
    public void removePrivateAccess(User user) {
        Optional<UserOAuthToken> tokenOpt = tokenRepository.findByUserIdAndProvider(user.getId(), "GITHUB");
        if (tokenOpt.isPresent()) {
            UserOAuthToken token = tokenOpt.get();
            token.setScope("read:user");
            token.setUpdatedAt(Instant.now());
            tokenRepository.save(token);
            log.info("Downgraded GitHub access to public-only for user {}", user.getId());
        }
    }

    @Transactional
    public void disconnectGitHub(User user) {
        if ("GITHUB".equalsIgnoreCase(user.getProvider())) {
            throw new BadRequestException("CANNOT_DISCONNECT_SIGNIN", "Cannot disconnect GitHub because it is your primary sign-in provider.");
        }

        Optional<UserOAuthToken> tokenOpt = tokenRepository.findByUserIdAndProvider(user.getId(), "GITHUB");
        if (tokenOpt.isPresent()) {
            UserOAuthToken token = tokenOpt.get();
            // Best effort revoke grant at GitHub
            tryRevokeGitHubGrant(token.getAccessTokenEncrypted());
            tokenRepository.deleteByUserIdAndProvider(user.getId(), "GITHUB");
            log.info("Disconnected GitHub integration for user {}", user.getId());
        }
    }

    @Transactional
    public CheckConnectionResponse checkConnection(User user) {
        Instant now = Instant.now();
        Instant lastCheck = lastCheckTimes.get(user.getId());
        if (lastCheck != null && ChronoUnit.SECONDS.between(lastCheck, now) < 15) {
            return new CheckConnectionResponse(true, "CONNECTED", "Connection checked recently.");
        }
        lastCheckTimes.put(user.getId(), now);

        Optional<UserOAuthToken> tokenOpt = tokenRepository.findByUserIdAndProvider(user.getId(), "GITHUB");
        if (tokenOpt.isEmpty()) {
            return new CheckConnectionResponse(false, "NEEDS_RECONNECT", "No GitHub credentials stored. Reconnect GitHub.");
        }

        UserOAuthToken token = tokenOpt.get();
        String plainToken;
        try {
            plainToken = secretCipher.decrypt(token.getAccessTokenEncrypted());
        } catch (Exception ex) {
            token.setStatus("NEEDS_RECONNECT");
            tokenRepository.save(token);
            return new CheckConnectionResponse(false, "NEEDS_RECONNECT", "Unable to decrypt credentials. Please reconnect.");
        }

        try {
            URL url = URI.create("https://api.github.com/user").toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(6000);
            conn.setRequestProperty("Authorization", "Bearer " + plainToken);
            conn.setRequestProperty("User-Agent", "HackathonOS-Server");
            conn.setRequestProperty("Accept", "application/vnd.github+json");

            int responseCode = conn.getResponseCode();
            if (responseCode == 401) {
                token.setStatus("NEEDS_RECONNECT");
                tokenRepository.save(token);
                return new CheckConnectionResponse(false, "NEEDS_RECONNECT", "GitHub token expired or revoked. Please reconnect.");
            } else if (responseCode >= 200 && responseCode < 300) {
                token.setStatus("CONNECTED");
                token.setLastUsedAt(now);
                tokenRepository.save(token);
                return new CheckConnectionResponse(true, "CONNECTED", "GitHub connection operational.");
            } else {
                return new CheckConnectionResponse(true, token.getStatus(), "GitHub responded with code " + responseCode);
            }
        } catch (Exception e) {
            log.warn("GitHub check failed with network error: {}", e.getMessage());
            return new CheckConnectionResponse(true, token.getStatus(), "Checked with local cached status (GitHub unreachable).");
        }
    }

    public void tryRevokeGitHubGrant(String encryptedToken) {
        try {
            String plainToken = secretCipher.decrypt(encryptedToken);
            String clientId = appProperties.getGithub().getLinkClientId();
            String clientSecret = appProperties.getGithub().getLinkClientSecret();
            if (clientId == null || clientSecret == null || clientId.isBlank() || clientSecret.isBlank()) return;

            URL url = URI.create("https://api.github.com/applications/" + clientId + "/grant").toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("DELETE");
            conn.setConnectTimeout(4000);
            conn.setReadTimeout(4000);
            conn.setDoOutput(true);

            String auth = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
            conn.setRequestProperty("Authorization", "Basic " + auth);
            conn.setRequestProperty("Accept", "application/vnd.github+json");
            conn.setRequestProperty("User-Agent", "HackathonOS-Server");

            String body = "{\"access_token\":\"" + plainToken + "\"}";
            conn.getOutputStream().write(body.getBytes(StandardCharsets.UTF_8));
            conn.getResponseCode();
        } catch (Exception ignored) {}
    }
}
