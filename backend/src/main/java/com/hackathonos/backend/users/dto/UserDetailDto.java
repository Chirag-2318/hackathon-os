package com.hackathonos.backend.users.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserDetailDto(
        UUID id,
        String name,
        String displayName,
        String firstName,
        String initials,
        String email,
        String avatarUrl,
        String provider,
        String timezone,
        String theme,
        String plan,
        Instant createdAt,
        long unreadNotifications,
        String username,
        String avatarType,
        Integer avatarPreset,
        List<String> roleTags,
        String experienceLevel,
        String goal,
        List<String> techStack,
        boolean onboardingCompleted,
        Instant onboardedAt,
        String tourStatus,
        String tourPath,
        int tourVersion,
        Instant tourCompletedAt,
        List<String> hotspotsSeen,
        UserPreferenceDto preferences,
        UserAiKeySummaryDto aiKey,
        boolean isAdmin
) {}

