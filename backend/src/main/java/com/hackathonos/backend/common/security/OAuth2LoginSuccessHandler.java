package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserOAuthTokenRepository;
import com.hackathonos.backend.users.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);

    private final UserService userService;
    private final UserOAuthTokenRepository userOAuthTokenRepository;
    private final SecretCipher secretCipher;
    private final AppProperties appProperties;
    private final OAuth2AuthorizedClientService authorizedClientService;
    private final SecurityContextRepository securityContextRepository;

    public OAuth2LoginSuccessHandler(UserService userService,
                                     UserOAuthTokenRepository userOAuthTokenRepository,
                                     SecretCipher secretCipher,
                                     AppProperties appProperties,
                                     @Autowired(required = false) OAuth2AuthorizedClientService authorizedClientService,
                                     @Autowired(required = false) SecurityContextRepository securityContextRepository) {
        this.userService = userService;
        this.userOAuthTokenRepository = userOAuthTokenRepository;
        this.secretCipher = secretCipher;
        this.appProperties = appProperties;
        this.authorizedClientService = authorizedClientService;
        this.securityContextRepository = securityContextRepository != null
                ? securityContextRepository
                : new HttpSessionSecurityContextRepository();
    }

    @Override
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
            log.warn("OAuth login rejected: signup closed, reason={}", ex.getReason());
            SecurityContextHolder.clearContext();
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            String targetUrl = appProperties.getPublicUrl() + "/full?reason="
                    + URLEncoder.encode(ex.getReason() != null ? ex.getReason() : "closed", StandardCharsets.UTF_8);
            response.sendRedirect(targetUrl);
            return;
        } catch (com.hackathonos.backend.common.error.AccountDeletedException ex) {
            log.warn("OAuth login rejected: account deleted for user: exception={}", ex.getMessage());
            SecurityContextHolder.clearContext();
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            String targetUrl = appProperties.getPublicUrl() + "/login?error=account_deleted";
            response.sendRedirect(targetUrl);
            return;
        } catch (Exception ex) {
            log.warn("OAuth login failed during user provisioning: exception={}, message={}",
                    ex.getClass().getName(), ex.getMessage(), ex);
            SecurityContextHolder.clearContext();
            String targetUrl = appProperties.getPublicUrl() + "/login?error=provisioning_failed";
            response.sendRedirect(targetUrl);
            return;
        }

        if ("GITHUB".equals(user.getProvider()) && authentication instanceof OAuth2AuthenticationToken oauthToken && authorizedClientService != null) {
            try {
                OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
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
            } catch (Exception e) {
                log.warn("Failed to persist GitHub OAuth token for user={}: {}", user.getId(), e.getMessage());
            }
        }

        // Persist SecurityContext into HTTP Session via SecurityContextRepository
        try {
            SecurityContext context = SecurityContextHolder.getContext();
            if (context == null || context.getAuthentication() == null) {
                context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(authentication);
                SecurityContextHolder.setContext(context);
            }
            securityContextRepository.saveContext(context, request, response);
            log.info("Persisted SecurityContext to session for user={}, provider={}", user.getId(), registrationId);
        } catch (Exception ex) {
            log.warn("Failed to persist SecurityContext to session during OAuth login: exception={}, message={}",
                    ex.getClass().getName(), ex.getMessage(), ex);
            response.sendRedirect(appProperties.getPublicUrl() + "/login?error=session_save_failed");
            return;
        }

        RequestCache requestCache = new HttpSessionRequestCache();
        SavedRequest savedRequest = requestCache.getRequest(request, response);
        if (savedRequest != null) {
            String redirectUrl = savedRequest.getRedirectUrl();
            if (redirectUrl != null) {
                try {
                    URI uri = URI.create(redirectUrl);
                    if ("/oauth/authorize".equals(uri.getPath())) {
                        requestCache.removeRequest(request, response);
                        response.sendRedirect(redirectUrl);
                        return;
                    }
                } catch (Exception ignored) {}
            }
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
