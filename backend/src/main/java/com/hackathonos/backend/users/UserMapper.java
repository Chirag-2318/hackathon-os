package com.hackathonos.backend.users;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.users.dto.ApiKeyDto;
import com.hackathonos.backend.users.dto.UserDetailDto;
import com.hackathonos.backend.users.dto.UserSettingsDto;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class UserMapper {

    private final ObjectMapper objectMapper;

    public UserMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public List<String> parseJsonList(String json) {
        if (json == null || json.isBlank() || json.equals("[]")) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public UserDetailDto toDetailDto(User user, UserSettings settings, long unreadCount) {
        String effectiveName = (settings != null && settings.getDisplayName() != null && !settings.getDisplayName().isBlank())
                ? settings.getDisplayName()
                : user.getName();

        String firstName = computeFirstName(effectiveName);
        String initials = computeInitials(effectiveName);
        String timezone = settings != null ? settings.getTimezone() : "UTC";
        String theme = settings != null ? settings.getTheme() : "system";
        String plan = settings != null ? settings.getPlan() : "FREE";

        return new UserDetailDto(
                user.getId(),
                user.getName(),
                effectiveName,
                firstName,
                initials,
                user.getEmail(),
                user.getAvatarUrl(),
                user.getProvider(),
                timezone,
                theme,
                plan,
                user.getCreatedAt(),
                unreadCount,
                user.getUsername(),
                user.getAvatarType(),
                user.getAvatarPreset(),
                parseJsonList(user.getRoleTags()),
                user.getExperienceLevel(),
                user.getGoal(),
                parseJsonList(user.getTechStack()),
                user.isOnboardingCompleted(),
                user.getOnboardedAt()
        );
    }

    public UserSettingsDto toSettingsDto(User user, UserSettings settings, List<UserApiKey> apiKeys) {
        String displayName = (settings != null && settings.getDisplayName() != null) ? settings.getDisplayName() : user.getName();
        String timezone = (settings != null) ? settings.getTimezone() : "UTC";
        String theme = (settings != null) ? settings.getTheme() : "system";
        String plan = (settings != null) ? settings.getPlan() : "FREE";

        boolean deadlines = settings == null || settings.isNotifyDeadlines();
        boolean mentions = settings == null || settings.isNotifyMentions();
        boolean blocked = settings == null || settings.isNotifyBlocked();
        boolean email = settings != null && settings.isNotifyEmail();

        UserSettingsDto.ProfileDto profile = new UserSettingsDto.ProfileDto(
                displayName,
                user.getEmail(),
                user.getAvatarUrl(),
                user.getProvider(),
                user.getLogin() != null ? user.getLogin() : "",
                List.of("Frontend", "Backend"),
                "Full time",
                "TypeScript, Java, React"
        );

        UserSettingsDto.AppearanceDto appearance = new UserSettingsDto.AppearanceDto(
                theme,
                timezone,
                "comfortable"
        );

        UserSettingsDto.NotificationsDto notifications = new UserSettingsDto.NotificationsDto(
                deadlines,
                mentions,
                blocked,
                email,
                blocked,
                deadlines,
                true,
                deadlines,
                true
        );

        UserSettingsDto.BillingDto billing = new UserSettingsDto.BillingDto(plan);

        List<ApiKeyDto> apiKeyDtos = new ArrayList<>();
        if (apiKeys != null) {
            for (UserApiKey k : apiKeys) {
                apiKeyDtos.add(toApiKeyDto(k));
            }
        }

        UserSettingsDto.AiAndKeysDto aiAndKeys = new UserSettingsDto.AiAndKeysDto(
                "promptBridge",
                Collections.emptyList()
        );

        boolean isGithub = "GITHUB".equalsIgnoreCase(user.getProvider());
        boolean isGoogle = "GOOGLE".equalsIgnoreCase(user.getProvider());
        UserSettingsDto.IntegrationsDto integrations = new UserSettingsDto.IntegrationsDto(
                new UserSettingsDto.IntegrationStatus(isGithub, isGithub ? user.getLogin() : null),
                new UserSettingsDto.IntegrationStatus(isGoogle, isGoogle ? user.getEmail() : null)
        );

        return new UserSettingsDto(profile, appearance, notifications, billing, apiKeyDtos, aiAndKeys, integrations);
    }

    public ApiKeyDto toApiKeyDto(UserApiKey apiKey) {
        return new ApiKeyDto(
                apiKey.getId(),
                apiKey.getProvider(),
                apiKey.getLabel(),
                apiKey.getLast4(),
                apiKey.getCreatedAt()
        );
    }

    private String computeFirstName(String name) {
        if (name == null || name.isBlank()) return "";
        return name.trim().split("\\s+")[0];
    }

    private String computeInitials(String name) {
        if (name == null || name.isBlank()) return "?";
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        String first = parts[0].substring(0, 1).toUpperCase();
        String last = parts[parts.length - 1].substring(0, 1).toUpperCase();
        return first + last;
    }
}
