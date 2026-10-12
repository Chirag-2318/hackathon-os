package com.hackathonos.backend.canva;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.security.SecretCipher;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserOAuthToken;
import com.hackathonos.backend.users.UserOAuthTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
public class CanvaService {

    private static final Logger log = LoggerFactory.getLogger(CanvaService.class);

    private final AppProperties appProperties;
    private final UserOAuthTokenRepository tokenRepository;
    private final SecretCipher secretCipher;
    private final ObjectMapper objectMapper;

    public CanvaService(
            AppProperties appProperties,
            UserOAuthTokenRepository tokenRepository,
            SecretCipher secretCipher,
            ObjectMapper objectMapper
    ) {
        this.appProperties = appProperties;
        this.tokenRepository = tokenRepository;
        this.secretCipher = secretCipher;
        this.objectMapper = objectMapper;
    }

    public boolean isConnected(User user) {
        if (!appProperties.getCanva().isConfigured() || user == null) return false;
        return tokenRepository.findByUserIdAndProvider(user.getId(), "CANVA").isPresent();
    }

    @Transactional
    public void saveToken(UUID userId, String accessToken, String refreshToken, Long expiresInSeconds, String scope) {
        long expiryEpoch = expiresInSeconds != null ? Instant.now().getEpochSecond() + expiresInSeconds : 0;
        String rawTokenPayload = accessToken + "||" + (refreshToken != null ? refreshToken : "") + "||" + expiryEpoch;
        String encrypted = secretCipher.encrypt(rawTokenPayload);

        UserOAuthToken token = tokenRepository.findByUserIdAndProvider(userId, "CANVA")
                .orElseGet(() -> new UserOAuthToken(userId, "CANVA", encrypted, scope, Instant.now()));

        token.setAccessTokenEncrypted(encrypted);
        token.setScope(scope);
        token.setUpdatedAt(Instant.now());
        tokenRepository.save(token);
    }

    @Transactional
    public void disconnect(User user) {
        if (user == null) return;
        tokenRepository.deleteByUserIdAndProvider(user.getId(), "CANVA");
    }

    public record CanvaDesignDto(
            String id,
            String title,
            String thumbnail,
            String viewUrl
    ) {}

    public List<CanvaDesignDto> getDesigns(User user, String query) {
        if (!appProperties.getCanva().isConfigured() || user == null) {
            return Collections.emptyList();
        }

        UserOAuthToken tokenEntity = tokenRepository.findByUserIdAndProvider(user.getId(), "CANVA").orElse(null);
        if (tokenEntity == null) return Collections.emptyList();

        String rawPayload = secretCipher.decrypt(tokenEntity.getAccessTokenEncrypted());
        if (rawPayload == null) return Collections.emptyList();

        String[] parts = rawPayload.split("\\|\\|");
        String accessToken = parts[0];
        String refreshToken = parts.length > 1 ? parts[1] : "";
        long expiryEpoch = parts.length > 2 && !parts[2].isBlank() ? Long.parseLong(parts[2]) : 0;

        // Auto-refresh if expired and refresh token exists
        if (expiryEpoch > 0 && Instant.now().getEpochSecond() > (expiryEpoch - 60) && !refreshToken.isBlank()) {
            String refreshed = refreshAccessToken(user.getId(), refreshToken, tokenEntity.getScope());
            if (refreshed != null) {
                accessToken = refreshed;
            }
        }

        try {
            String urlStr = "https://api.canva.com/rest/v1/designs";
            if (query != null && !query.isBlank()) {
                urlStr += "?query=" + URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);
            }
            URL url = URI.create(urlStr).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + accessToken);
            conn.setRequestProperty("Accept", "application/json");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);

            if (conn.getResponseCode() >= 400) {
                log.warn("Canva GET /designs returned HTTP {}", conn.getResponseCode());
                return Collections.emptyList();
            }

            JsonNode root;
            try (InputStream in = conn.getInputStream()) {
                root = objectMapper.readTree(in);
            }

            List<CanvaDesignDto> result = new ArrayList<>();
            JsonNode items = root.path("items");
            if (items.isArray()) {
                for (JsonNode item : items) {
                    String id = item.path("id").asText();
                    String title = item.path("title").asText("Untitled Design");
                    String thumb = item.path("thumbnail").path("url").asText(null);
                    String viewUrl = item.path("urls").path("view_url").asText(null);
                    if (viewUrl == null) {
                        viewUrl = item.path("urls").path("edit_url").asText(null);
                    }
                    result.add(new CanvaDesignDto(id, title, thumb, viewUrl));
                }
            }
            return result;
        } catch (Exception e) {
            log.warn("Failed to fetch Canva designs: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private String refreshAccessToken(UUID userId, String refreshToken, String scope) {
        try {
            URL url = URI.create("https://api.canva.com/rest/v1/oauth/token").toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");

            String clientId = appProperties.getCanva().getClientId();
            String clientSecret = appProperties.getCanva().getClientSecret();
            String auth = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
            conn.setRequestProperty("Authorization", "Basic " + auth);

            String body = "grant_type=refresh_token&refresh_token=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.getBytes(StandardCharsets.UTF_8));
            }

            if (conn.getResponseCode() >= 400) {
                return null;
            }

            JsonNode node;
            try (InputStream in = conn.getInputStream()) {
                node = objectMapper.readTree(in);
            }

            String newAccess = node.path("access_token").asText(null);
            String newRefresh = node.path("refresh_token").asText(refreshToken);
            Long expiresIn = node.has("expires_in") ? node.path("expires_in").asLong() : null;
            if (newAccess != null) {
                saveToken(userId, newAccess, newRefresh, expiresIn, scope);
                return newAccess;
            }
        } catch (Exception e) {
            log.warn("Canva token refresh failed: {}", e.getMessage());
        }
        return null;
    }
}
