package com.hackathonos.backend.users.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DataSummaryResponse(
        AccountSummary account,
        ProfileSummary profile,
        List<RoomMembershipSummary> rooms,
        ContentSummary content,
        FilesSummary files,
        CountSummary notifications,
        CountSummary emailLog,
        IntegrationsSummary integrations,
        UserPreferenceDto preferences,
        RetentionSummary retention
) {
    public record AccountSummary(
            String email,
            List<String> signInProviders,
            Instant lastLoginAt
    ) {}

    public record ProfileSummary(
            String username,
            String displayName,
            String avatar,
            List<String> roles,
            String experience,
            String goal,
            List<String> stack
    ) {}

    public record RoomMembershipSummary(
            UUID roomId,
            String roomName,
            String role
    ) {}

    public record ContentSummary(
            long ideasCount,
            long tasksCount,
            long commentsCount,
            long documentsEditedCount
    ) {}

    public record FilesSummary(
            int count,
            long totalSizeBytes,
            String formattedTotalSize
    ) {}

    public record CountSummary(
            long count
    ) {}

    public record IntegrationsSummary(
            boolean githubTokenStoredEncrypted
    ) {}

    public record RetentionSummary(
            int notificationsDays,
            int emailLogDays,
            int deletedRoomsDays
    ) {}
}
