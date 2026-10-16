package com.hackathonos.backend.ideas.dto;

import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.dto.UserSummaryDto;

public record AuthorDto(
        String userId,
        String name,
        String initials,
        String avatarUrl,
        String avatarType,
        Integer avatarPreset,
        String username,
        UserSummaryDto user
) {
    public AuthorDto(String userId, String name, String initials, String avatarUrl) {
        this(userId, name, initials, avatarUrl, "NONE", null, null, null);
    }

    public static AuthorDto from(User user, String fallbackName) {
        if (user == null) {
            String initials = computeInitials(fallbackName);
            return new AuthorDto(null, fallbackName != null ? fallbackName : "Unknown", initials, null, "NONE", null, null, null);
        }
        UserSummaryDto summary = UserSummaryDto.from(user, fallbackName);
        String initials = computeInitials(summary.displayName());
        return new AuthorDto(
                user.getId().toString(),
                summary.displayName(),
                initials,
                summary.avatarUrl(),
                summary.avatarType(),
                summary.avatarPreset(),
                user.getUsername(),
                summary
        );
    }

    private static String computeInitials(String name) {
        if (name == null || name.isBlank()) return "U";
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
    }
}
