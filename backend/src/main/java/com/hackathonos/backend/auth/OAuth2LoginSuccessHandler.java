package com.hackathonos.backend.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;

    public OAuth2LoginSuccessHandler(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String registrationId = extractProvider(request);

        String providerId;
        String email;
        String displayName;
        String avatarUrl;

        if ("github".equals(registrationId)) {
            providerId = String.valueOf(oAuth2User.getAttributes().get("id"));
            email = (String) oAuth2User.getAttributes().get("email");
            displayName = (String) oAuth2User.getAttributes().get("login");
            avatarUrl = (String) oAuth2User.getAttributes().get("avatar_url");
        } else {
            providerId = (String) oAuth2User.getAttributes().get("sub");
            email = (String) oAuth2User.getAttributes().get("email");
            displayName = (String) oAuth2User.getAttributes().get("name");
            avatarUrl = (String) oAuth2User.getAttributes().get("picture");
        }

        userRepository.findByProviderAndProviderId(registrationId, providerId)
                .orElseGet(() -> userRepository.save(
                        new User(registrationId, providerId, email, displayName, avatarUrl)
                ));

        response.sendRedirect("http://localhost:5173/app");
    }

    private String extractProvider(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri.contains("github")) return "github";
        if (uri.contains("google")) return "google";
        throw new IllegalStateException("Unknown OAuth2 provider in callback URI: " + uri);
    }
}
