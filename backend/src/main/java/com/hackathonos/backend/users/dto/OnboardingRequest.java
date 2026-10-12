package com.hackathonos.backend.users.dto;

import java.util.List;

public record OnboardingRequest(
        String username,
        String avatarType,
        Integer avatarPreset,
        String avatarUrl,
        List<String> roleTags,
        String experienceLevel,
        String goal,
        List<String> techStack
) {}
