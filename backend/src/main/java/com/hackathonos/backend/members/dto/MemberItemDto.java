package com.hackathonos.backend.members.dto;

import com.hackathonos.backend.users.dto.UserSummaryDto;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MemberItemDto(
        UUID userId,
        String name,
        String initials,
        String email,
        String avatarUrl,
        String role,
        List<String> skills,
        String status,
        Instant joinedAt,
        Instant lastSeenAt,
        boolean isLeader,
        boolean isMe,
        UUID invitationId,
        String username,
        String avatarType,
        Integer avatarPreset,
        UserSummaryDto user
) {
    public MemberItemDto(
            UUID userId,
            String name,
            String initials,
            String email,
            String avatarUrl,
            String role,
            List<String> skills,
            String status,
            Instant joinedAt,
            Instant lastSeenAt,
            boolean isLeader,
            boolean isMe,
            UUID invitationId
    ) {
        this(
                userId,
                name,
                initials,
                email,
                avatarUrl,
                role,
                skills,
                status,
                joinedAt,
                lastSeenAt,
                isLeader,
                isMe,
                invitationId,
                null,
                avatarUrl != null ? "CUSTOM" : "NONE",
                null,
                userId != null ? new UserSummaryDto(userId, null, name, avatarUrl) : null
        );
    }

    public MemberItemDto(
            UUID userId,
            String name,
            String initials,
            String email,
            String avatarUrl,
            String role,
            List<String> skills,
            String status,
            Instant joinedAt,
            Instant lastSeenAt,
            boolean isLeader,
            boolean isMe,
            UUID invitationId,
            String username,
            UserSummaryDto user
    ) {
        this(
                userId,
                name,
                initials,
                email,
                avatarUrl,
                role,
                skills,
                status,
                joinedAt,
                lastSeenAt,
                isLeader,
                isMe,
                invitationId,
                username,
                user != null ? user.avatarType() : (avatarUrl != null ? "CUSTOM" : "NONE"),
                user != null ? user.avatarPreset() : null,
                user
        );
    }
}
