package com.hackathonos.backend.tasks.dto;

import com.hackathonos.backend.users.dto.UserSummaryDto;
import java.util.UUID;

public record TaskUserDto(
        UUID userId,
        String name,
        String initials,
        String avatarUrl,
        String username,
        String avatarType,
        Integer avatarPreset,
        UserSummaryDto user
) {
    public TaskUserDto(UUID userId, String name, String initials, String avatarUrl) {
        this(userId, name, initials, avatarUrl, null, avatarUrl != null ? "CUSTOM" : "NONE", null,
                userId != null ? new UserSummaryDto(userId, null, name, avatarUrl) : null);
    }

    public TaskUserDto(UUID userId, String name, String initials, String avatarUrl, String username, UserSummaryDto user) {
        this(userId, name, initials, avatarUrl, username,
                user != null ? user.avatarType() : (avatarUrl != null ? "CUSTOM" : "NONE"),
                user != null ? user.avatarPreset() : null,
                user);
    }
}
