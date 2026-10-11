package com.hackathonos.backend.users.dto;

import java.util.List;

public record UserSettingsDto(
        ProfileDto profile,
        AppearanceDto appearance,
        NotificationsDto notifications,
        BillingDto billing,
        List<ApiKeyDto> apiKeys,
        AiAndKeysDto aiAndKeys,
        IntegrationsDto integrations
) {
    public record ProfileDto(
            String displayName,
            String email,
            String avatarUrl,
            String provider,
            String githubHandle,
            List<String> roleTags,
            String availability,
            String skills
    ) {}

    public record AppearanceDto(
            String theme,
            String timezone,
            String density
    ) {}

    public record NotificationsDto(
            boolean deadlines,
            boolean mentions,
            boolean blocked,
            boolean email,
            boolean blockerAlerts,
            boolean checkpointReminders,
            boolean taskAssignments,
            boolean deadlineReminders,
            boolean teamAnnouncements
    ) {}

    public record BillingDto(
            String plan
    ) {}

    public record AiAndKeysDto(
            String mode,
            List<Object> providers
    ) {}

    public record IntegrationsDto(
            IntegrationStatus github,
            IntegrationStatus google
    ) {}

    public record IntegrationStatus(
            boolean connected,
            String username
    ) {}
}
