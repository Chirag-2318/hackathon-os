package com.hackathonos.backend.users.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UpdateSettingsRequest(
        String displayName,
        String theme,
        String timezone,
        Boolean notifyDeadlines,
        Boolean notifyMentions,
        Boolean notifyBlocked,
        Boolean notifyEmail,
        Map<String, Object> profile,
        Map<String, Object> appearance,
        Map<String, Object> notifications
) {}
