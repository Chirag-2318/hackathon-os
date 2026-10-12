package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.error.AccountDeletedException;
import com.hackathonos.backend.common.error.UnauthenticatedException;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import com.hackathonos.backend.users.UserService;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

    private final UserRepository userRepository;
    private final UserService userService;

    public CurrentUser(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    public java.util.Optional<User> getOptional() {
        try {
            return java.util.Optional.ofNullable(get());
        } catch (Exception e) {
            return java.util.Optional.empty();
        }
    }

    /**
     * Resolves the authenticated user from the current security context. Never returns null.
     * Throws UnauthenticatedException (401) if not authenticated.
     * Throws AccountDeletedException (401) if the account was deleted.
     */
    public User get() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthenticatedException("UNAUTHENTICATED", "Authentication required");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof OAuth2User oauth2User) {
            String registrationId = null;
            if (authentication instanceof OAuth2AuthenticationToken token) {
                registrationId = token.getAuthorizedClientRegistrationId();
            }
            return userService.findOrCreateFromPrincipal(oauth2User, registrationId);
        }

        if (principal instanceof User user) {
            if (user.getDeletedAt() != null) {
                throw new AccountDeletedException("ACCOUNT_DELETED", "User account has been deleted");
            }
            return userRepository.findById(user.getId())
                    .map(existing -> {
                        if (existing.getDeletedAt() != null) {
                            throw new AccountDeletedException("ACCOUNT_DELETED", "User account has been deleted");
                        }
                        return existing;
                    })
                    .orElse(user);
        }

        String name = authentication.getName();
        if (name == null || name.isBlank() || "anonymousUser".equalsIgnoreCase(name)) {
            throw new UnauthenticatedException("UNAUTHENTICATED", "Authentication required");
        }

        return userRepository.findByEmailIgnoreCase(name)
                .map(existing -> {
                    if (existing.getDeletedAt() != null) {
                        throw new AccountDeletedException("ACCOUNT_DELETED", "User account has been deleted");
                    }
                    return existing;
                })
                .orElseThrow(() -> new UnauthenticatedException("UNAUTHENTICATED", "User not authenticated"));
    }

    /**
     * Resolves the user from an OAuth2 principal. Never returns null.
     */
    public User resolve(OAuth2User principal) {
        return userService.findOrCreateFromPrincipal(principal, null);
    }
}
