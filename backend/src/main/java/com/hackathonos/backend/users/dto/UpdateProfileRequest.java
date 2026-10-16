package com.hackathonos.backend.users.dto;

import java.util.List;

public record UpdateProfileRequest(
        String avatarType,
        Integer avatarPreset,
        String avatarUrl,
        List<String> roleTags
) {}
