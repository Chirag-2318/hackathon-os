package com.hackathonos.backend.canva;

import com.hackathonos.backend.common.security.OAuthLinkStateService;
import com.hackathonos.backend.common.security.OAuthLinkState;
import com.hackathonos.backend.common.error.BadRequestException;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.*;

@RestController
@RequestMapping("/api/v1/integrations/canva")
public class CanvaController {

    private static final Logger log = LoggerFactory.getLogger(CanvaController.class);

    private final CanvaService canvaService;
    private final CurrentUser currentUser;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final OAuthLinkStateService oAuthLinkStateService;

    public CanvaController(
            CanvaService canvaService,
            CurrentUser currentUser,
            AppProperties appProperties,
            ObjectMapper objectMapper,
            OAuthLinkStateService oAuthLinkStateService
    ) {
        this.canvaService = canvaService;
        this.currentUser = currentUser;
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
        this.oAuthLinkStateService = oAuthLinkStateService;
    }

    private User resolveUser(User user) {
        return user != null ? user : currentUser.get();
    }

    @GetMapping("/status")
    public Map<String, Boolean> getStatus(@AuthenticationPrincipal User user) {
        boolean connected = canvaService.isConnected(resolveUser(user));
        return Map.of("connected", connected);
    }

    @GetMapping("/connect")
    public void connect(
            @RequestParam(required = false) UUID roomId,
            @AuthenticationPrincipal User user,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws Exception {
        User u = resolveUser(user);
        if (u == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return;
        }

        if (!appProperties.getCanva().isConfigured()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Canva integration not configured");
            return;
        }

        // Generate PKCE code_verifier and code_challenge
        byte[] verifierBytes = new byte[32];
        new SecureRandom().nextBytes(verifierBytes);
        String codeVerifier = Base64.getUrlEncoder().withoutPadding().encodeToString(verifierBytes);

        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] digest = md.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
        String codeChallenge = Base64.getUrlEncoder().withoutPadding().encodeToString(digest);

        String returnPath = roomId != null ? "/app/room/" + roomId + "/deck" : "/app/rooms";
        OAuthLinkState linkState = oAuthLinkStateService.createLinkState(
                "CANVA",
                u.getId(),
                roomId,
                codeVerifier,
                returnPath
        );

        String callbackUrl = oAuthLinkStateService.buildRedirectUri("/api/v1/integrations/canva/callback");
        String scope = "design:content:read design:meta:read";

        String authUrl = "https://www.canva.com/api/oauth/authorize"
                + "?response_type=code"
                + "&client_id=" + URLEncoder.encode(appProperties.getCanva().getClientId(), StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8)
                + "&scope=" + URLEncoder.encode(scope, StandardCharsets.UTF_8)
                + "&code_challenge=" + URLEncoder.encode(codeChallenge, StandardCharsets.UTF_8)
                + "&code_challenge_method=s256"
                + "&state=" + URLEncoder.encode(linkState.getState(), StandardCharsets.UTF_8);

        response.sendRedirect(authUrl);
    }

    @GetMapping("/callback")
    public void callback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @AuthenticationPrincipal User currentUserAuth,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws Exception {
        String defaultTarget = appProperties.getFrontendUrl() + "/app/rooms";

        if (error != null) {
            response.sendRedirect(defaultTarget + "?canva=error&reason=" + URLEncoder.encode(error, StandardCharsets.UTF_8));
            return;
        }

        OAuthLinkState linkState;
        try {
            User resolved = null;
            try { resolved = resolveUser(currentUserAuth); } catch (Exception ignored) {}
            UUID currentUserId = resolved != null ? resolved.getId() : null;
            linkState = oAuthLinkStateService.consumeState(state, "CANVA", currentUserId);
        } catch (BadRequestException ex) {
            response.sendRedirect(defaultTarget + "?canva=error&reason=" + URLEncoder.encode(ex.getCode() != null ? ex.getCode().toLowerCase() : "state_mismatch", StandardCharsets.UTF_8));
            return;
        }

        UUID userId = linkState.getUserId();
        String codeVerifier = linkState.getCodeVerifier();
        UUID roomId = linkState.getRoomId();
        String redirectTarget = appProperties.getFrontendUrl() + (linkState.getReturnPath() != null
                ? linkState.getReturnPath()
                : (roomId != null ? "/app/room/" + roomId + "/deck" : "/app/rooms"));

        if (code == null || code.isBlank() || codeVerifier == null) {
            response.sendRedirect(redirectTarget + "?canva=error&reason=no_code");
            return;
        }

        try {
            URL tokenUrl = URI.create("https://api.canva.com/rest/v1/oauth/token").toURL();
            HttpURLConnection conn = (HttpURLConnection) tokenUrl.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");

            String clientId = appProperties.getCanva().getClientId();
            String clientSecret = appProperties.getCanva().getClientSecret();
            String authHeader = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
            conn.setRequestProperty("Authorization", "Basic " + authHeader);

            String callbackUrl = oAuthLinkStateService.buildRedirectUri("/api/v1/integrations/canva/callback");
            String formBody = "grant_type=authorization_code"
                    + "&code=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
                    + "&code_verifier=" + URLEncoder.encode(codeVerifier, StandardCharsets.UTF_8)
                    + "&redirect_uri=" + URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(formBody.getBytes(StandardCharsets.UTF_8));
            }

            if (conn.getResponseCode() >= 400) {
                log.warn("Canva token exchange failed with status {}", conn.getResponseCode());
                response.sendRedirect(redirectTarget + "?canva=error&reason=token_exchange_failed");
                return;
            }

            JsonNode tokenNode;
            try (InputStream in = conn.getInputStream()) {
                tokenNode = objectMapper.readTree(in);
            }

            String accessToken = tokenNode.path("access_token").asText(null);
            String refreshToken = tokenNode.path("refresh_token").asText(null);
            Long expiresIn = tokenNode.has("expires_in") ? tokenNode.path("expires_in").asLong() : null;
            String scope = tokenNode.path("scope").asText("design:content:read design:meta:read");

            if (accessToken != null) {
                canvaService.saveToken(userId, accessToken, refreshToken, expiresIn, scope);
            }

            HttpSession session = request.getSession(false);
            if (session != null) {
                session.removeAttribute("canva_oauth_state");
                session.removeAttribute("canva_code_verifier");
                session.removeAttribute("canva_user_id");
                session.removeAttribute("canva_room_id");
            }

            response.sendRedirect(redirectTarget + "?canva=connected");
        } catch (Exception e) {
            log.error("Canva OAuth callback error: {}", e.getMessage(), e);
            response.sendRedirect(redirectTarget + "?canva=error&reason=unexpected");
        }
    }

    @DeleteMapping
    public ResponseEntity<Void> disconnect(@AuthenticationPrincipal User user) {
        canvaService.disconnect(resolveUser(user));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/designs")
    public List<CanvaService.CanvaDesignDto> getDesigns(
            @RequestParam(required = false) String q,
            @AuthenticationPrincipal User user
    ) {
        return canvaService.getDesigns(resolveUser(user), q);
    }
}
