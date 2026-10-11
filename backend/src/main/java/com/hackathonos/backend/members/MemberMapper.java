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
        String name = user != null ? user.getName() : "Unknown Member";
        String email = user != null ? user.getEmail() : null;
        String avatarUrl = user != null ? user.getAvatarUrl() : null;
        String initials = computeInitials(name);
        boolean isLeader = "LEADER".equalsIgnoreCase(member.getRole());
        boolean isMe = user != null && user.getId().equals(currentUserId);

        return new MemberItemDto(
                member.getUserId(),
                name,
                initials,
                email,
                avatarUrl,
                member.getRole(),
                skills != null ? skills : Collections.emptyList(),
                member.getStatus(),
                member.getJoinedAt(),
                member.getLastSeenAt(),
                isLeader,
                isMe,
                null
        );
    }

    public MemberItemDto toInvitationDto(RoomInvitation invitation) {
        String name = invitation.getInviteeText();
        String initials = computeInitials(name);

        return new MemberItemDto(
                null,
                name,
                initials,
                name.contains("@") ? name : null,
                null,
                invitation.getRole(),
                Collections.emptyList(),
                "PENDING",
                invitation.getCreatedAt(),
                null,
                false,
                false,
                invitation.getId()
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
