package com.hackathonos.backend.members;

import com.hackathonos.backend.members.dto.MemberItemDto;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Component
public class MemberMapper {

    public MemberItemDto toMemberDto(RoomMember member, User user, List<String> skills, UUID currentUserId) {
        String name = user != null && user.getName() != null ? user.getName() : "Unknown Member";
        String email = user != null ? user.getEmail() : null;
        String avatarUrl = user != null ? user.getAvatarUrl() : null;
        String initials = computeInitials(name);
        boolean isLeader = member != null && "LEADER".equalsIgnoreCase(member.getRole());
        boolean isMe = user != null && currentUserId != null && currentUserId.equals(user.getId());

        String username = user != null ? user.getUsername() : null;
        com.hackathonos.backend.users.dto.UserSummaryDto userSummary = user != null
                ? com.hackathonos.backend.users.dto.UserSummaryDto.from(user, name)
                : null;
        avatarUrl = userSummary != null ? userSummary.avatarUrl() : null;
        String avatarType = userSummary != null ? userSummary.avatarType() : "NONE";
        Integer avatarPreset = userSummary != null ? userSummary.avatarPreset() : null;

        return new MemberItemDto(
                member != null ? member.getUserId() : null,
                name,
                initials,
                email,
                avatarUrl,
                member != null ? member.getRole() : "BUILDER",
                skills != null ? skills : Collections.emptyList(),
                member != null ? member.getStatus() : "ACTIVE",
                member != null ? member.getJoinedAt() : null,
                member != null ? member.getLastSeenAt() : null,
                isLeader,
                isMe,
                null,
                username,
                avatarType,
                avatarPreset,
                userSummary
        );
    }

    public MemberItemDto toInvitationDto(RoomInvitation invitation) {
        String name = invitation != null && invitation.getInviteeText() != null ? invitation.getInviteeText() : "Invited Teammate";
        String initials = computeInitials(name);

        return new MemberItemDto(
                null,
                name,
                initials,
                name != null && name.contains("@") ? name : null,
                null,
                invitation != null && invitation.getRole() != null ? invitation.getRole() : "BUILDER",
                Collections.emptyList(),
                "PENDING",
                invitation != null ? invitation.getCreatedAt() : null,
                null,
                false,
                false,
                invitation != null ? invitation.getId() : null
        );
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
