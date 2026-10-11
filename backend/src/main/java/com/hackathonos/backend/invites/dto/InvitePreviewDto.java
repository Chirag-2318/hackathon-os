package com.hackathonos.backend.invites.dto;

import java.time.Instant;
import java.util.List;

public record InvitePreviewDto(
        boolean valid,
        String reason,
        String roomName,
        String hostName,
        String hostAvatarUrl,
        Long memberCount,
        List<String> skillsNeeded,
        Instant expiresAt,
        Boolean alreadyMember
) {}
