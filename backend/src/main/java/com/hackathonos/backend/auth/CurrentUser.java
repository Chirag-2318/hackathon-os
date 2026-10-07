package com.hackathonos.backend.auth;

import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

    private final UserRepository userRepository;

    public CurrentUser(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User resolve(OAuth2User principal) {
        String provider = principal.getAttributes().containsKey("login") ? "github" : "google";
        String providerId = provider.equals("github")
                ? String.valueOf(principal.getAttributes().get("id"))
                : (String) principal.getAttributes().get("sub");

        return userRepository.findByProviderAndProviderId(provider, providerId)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in database"));
    }
}
