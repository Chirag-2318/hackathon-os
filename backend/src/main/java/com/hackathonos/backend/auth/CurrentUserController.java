package com.hackathonos.backend.auth;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CurrentUserController {

    private final CurrentUser currentUser;

    public CurrentUserController(CurrentUser currentUser) {
        this.currentUser = currentUser;
    }

    @GetMapping("/api/v1/me")
    public UserResponse me(@AuthenticationPrincipal OAuth2User principal) {
        User user = currentUser.resolve(principal);
        return new UserResponse(user.getId(), user.getDisplayName(), user.getEmail(), user.getAvatarUrl());
    }

    public record UserResponse(Long id, String displayName, String email, String avatarUrl) {}
}