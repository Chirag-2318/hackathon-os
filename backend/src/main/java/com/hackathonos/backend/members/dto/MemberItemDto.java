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
                userId != null ? new UserSummaryDto(userId, null, name, avatarUrl) : null
        );
    }
}
