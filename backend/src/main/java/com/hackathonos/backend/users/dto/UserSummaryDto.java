package com.hackathonos.backend.users.dto;

import com.hackathonos.backend.users.User;
import java.util.UUID;

/**
 * Shared UserSummary DTO { id, username, displayName, avatarType, avatarPreset, avatarUrl }
 */
public record UserSummaryDto(
        UUID id,
        String username,
        String displayName,
        String avatarType,
        Integer avatarPreset,
        String avatarUrl
) {
    public UserSummaryDto(UUID id, String username, String displayName, String avatarUrl) {
        this(id, username, displayName, avatarUrl != null ? "CUSTOM" : "NONE", null, avatarUrl);
    }

    public record ResolvedAvatar(String avatarType, Integer avatarPreset, String avatarUrl) {}

    public static ResolvedAvatar resolveAvatar(User user) {
        if (user == null) {
            return new ResolvedAvatar("NONE", null, null);
        }

        boolean hasPreset = user.getAvatarPreset() != null && user.getAvatarPreset() >= 1 && user.getAvatarPreset() <= 10;
        boolean hasCustomUrl = user.getAvatarUrl() != null && !user.getAvatarUrl().isBlank();

        if (user.isOnboardingCompleted()) {
            if ("PRESET".equalsIgnoreCase(user.getAvatarType()) && hasPreset) {
                return new ResolvedAvatar("PRESET", user.getAvatarPreset(), null);
            } else if ("CUSTOM".equalsIgnoreCase(user.getAvatarType()) && hasCustomUrl) {
                return new ResolvedAvatar("CUSTOM", null, user.getAvatarUrl());
            } else if (hasPreset) {
                return new ResolvedAvatar("PRESET", user.getAvatarPreset(), null);
            } else if (hasCustomUrl) {
                return new ResolvedAvatar("CUSTOM", null, user.getAvatarUrl());
            } else {
                return new ResolvedAvatar("NONE", null, null);
            }
        } else {
            // onboarding not completed
            if ("PRESET".equalsIgnoreCase(user.getAvatarType()) && hasPreset) {
                return new ResolvedAvatar("PRESET", user.getAvatarPreset(), null);
            } else if ("CUSTOM".equalsIgnoreCase(user.getAvatarType()) && hasCustomUrl) {
                return new ResolvedAvatar("CUSTOM", null, user.getAvatarUrl());
            } else if (hasPreset) {
                return new ResolvedAvatar("PRESET", user.getAvatarPreset(), null);
            } else if (hasCustomUrl) {
                return new ResolvedAvatar("CUSTOM", null, user.getAvatarUrl());
            } else {
                // provider_avatar_url is returned as avatarUrl ONLY when onboarding_completed is false and no avatar was chosen
                String providerUrl = user.getProviderAvatarUrl();
                if (providerUrl != null && !providerUrl.isBlank()) {
                    return new ResolvedAvatar("CUSTOM", null, providerUrl);
                }
                return new ResolvedAvatar("NONE", null, null);
            }
        }
    }

    public static UserSummaryDto from(User user) {
        if (user == null) {
            return new UserSummaryDto(null, "deleted", "Deleted user", "NONE", null, null);
        }
        String display = (user.getName() != null && !user.getName().isBlank())
                ? user.getName()
                : (user.getUsername() != null ? user.getUsername() : "User");
        return from(user, display);
    }

    public static UserSummaryDto from(User user, String fallbackName) {
        if (user == null) {
            return new UserSummaryDto(null, "deleted", "Deleted user", "NONE", null, null);
        }
        String display = (fallbackName != null && !fallbackName.isBlank())
                ? fallbackName
                : (user.getName() != null && !user.getName().isBlank() ? user.getName() : (user.getUsername() != null ? user.getUsername() : "User"));
        ResolvedAvatar resolved = resolveAvatar(user);
        return new UserSummaryDto(
                user.getId(),
                user.getUsername(),
                display,
                resolved.avatarType(),
                resolved.avatarPreset(),
                resolved.avatarUrl()
        );
    }
}
