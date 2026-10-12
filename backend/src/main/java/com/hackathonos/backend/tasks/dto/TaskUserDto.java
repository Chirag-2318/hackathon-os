package com.hackathonos.backend.tasks.dto;

import com.hackathonos.backend.users.dto.UserSummaryDto;
import java.util.UUID;

public record TaskUserDto(
        UUID userId,
        String name,
        String initials,
        String avatarUrl,
        String username,
        UserSummaryDto user
) {
    public TaskUserDto(UUID userId, String name, String initials, String avatarUrl) {
        this(userId, name, initials, avatarUrl, null,
                userId != null ? new UserSummaryDto(userId, null, name, avatarUrl) : null);
    }
}
