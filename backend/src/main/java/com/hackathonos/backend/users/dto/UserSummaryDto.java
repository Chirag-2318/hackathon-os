package com.hackathonos.backend.users.dto;

import com.hackathonos.backend.users.User;
import java.util.UUID;

/**
 * Shared UserSummary DTO { id, username, displayName, avatarUrl }
 */
public record UserSummaryDto(
        UUID id,
        String username,
        String displayName,
        String avatarUrl
) {
    public static UserSummaryDto from(User user) {
        if (user == null) return null;
        String display = user.getName() != null && !user.getName().isBlank()
                ? user.getName()
                : (user.getUsername() != null ? user.getUsername() : "User");
        return new UserSummaryDto(
                user.getId(),
                user.getUsername(),
                display,
                user.getAvatarUrl()
        );
    }

    public static UserSummaryDto from(User user, String fallbackName) {
        if (user == null) return null;
        String display = (fallbackName != null && !fallbackName.isBlank())
                ? fallbackName
                : (user.getName() != null && !user.getName().isBlank() ? user.getName() : user.getUsername());
        return new UserSummaryDto(
                user.getId(),
                user.getUsername(),
                display,
                user.getAvatarUrl()
        );
    }
}
