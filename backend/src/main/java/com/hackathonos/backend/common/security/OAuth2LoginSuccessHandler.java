package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import com.hackathonos.backend.users.UserSettings;
import com.hackathonos.backend.users.UserSettingsRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.Instant;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final com.hackathonos.backend.users.UserService userService;
    private final com.hackathonos.backend.users.UserOAuthTokenRepository userOAuthTokenRepository;
    private final SecretCipher secretCipher;
    private final AppProperties appProperties;
    private final org.springframework.security.oauth2.client.OAuth2AuthorizedClientService authorizedClientService;

    public OAuth2LoginSuccessHandler(com.hackathonos.backend.users.UserService userService,
                                     com.hackathonos.backend.users.UserOAuthTokenRepository userOAuthTokenRepository,
                                     SecretCipher secretCipher,
                                     AppProperties appProperties,
                                     @org.springframework.beans.factory.annotation.Autowired(required = false)
                                     org.springframework.security.oauth2.client.OAuth2AuthorizedClientService authorizedClientService) {
        this.userService = userService;
        this.userOAuthTokenRepository = userOAuthTokenRepository;
        this.secretCipher = secretCipher;
        this.appProperties = appProperties;
        this.authorizedClientService = authorizedClientService;
    }

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String registrationId = "github";
        if (authentication instanceof OAuth2AuthenticationToken token) {
            registrationId = token.getAuthorizedClientRegistrationId();
        } else {
            registrationId = extractProviderFromUri(request);
        }

        final User user;
        try {
            user = userService.findOrCreateFromPrincipal(oauth2User, registrationId);
        } catch (com.hackathonos.backend.common.error.SignupClosedException ex) {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
            jakarta.servlet.http.HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            String targetUrl = appProperties.getPublicUrl() + "/full?reason=" + ex.getReason();
            response.sendRedirect(targetUrl);
            return;
        } catch (com.hackathonos.backend.common.error.AccountDeletedException ex) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"code\":\"ACCOUNT_DELETED\",\"message\":\"" + ex.getMessage() + "\"}");
            return;
        }

        if ("GITHUB".equals(user.getProvider()) && authentication instanceof OAuth2AuthenticationToken oauthToken && authorizedClientService != null) {
            try {
                org.springframework.security.oauth2.client.OAuth2AuthorizedClient client =
                        authorizedClientService.loadAuthorizedClient(
                                oauthToken.getAuthorizedClientRegistrationId(),
                                oauthToken.getName()
                        );
                if (client != null && client.getAccessToken() != null) {
                    String tokenVal = client.getAccessToken().getTokenValue();
                    String encrypted = secretCipher.encrypt(tokenVal);
                    String scopes = client.getAccessToken().getScopes() != null ?
                            String.join(" ", client.getAccessToken().getScopes()) : null;
                    userOAuthTokenRepository.save(new com.hackathonos.backend.users.UserOAuthToken(
                            user.getId(),
                            "GITHUB",
                            encrypted,
                            scopes,
                            Instant.now()
                    ));
                }
            } catch (Exception ignored) {}
        }

        String targetUrl = appProperties.getPublicUrl() + "/app";
        response.sendRedirect(targetUrl);
    }

    private String extractProviderFromUri(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri.contains("github")) return "github";
        if (uri.contains("google")) return "google";
        return "github";
    }
}
