package com.hackathonos.backend.room;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
public class RoomAuthorization {

    private final RoomMemberRepository roomMemberRepository;

    public RoomAuthorization(RoomMemberRepository roomMemberRepository) {
        this.roomMemberRepository = roomMemberRepository;
    }

    /** Throws 403 unless the user is any member of the room. */
    public RoomMember requireMember(Long roomId, Long userId) {
        return roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new AccessDeniedException(
                        "You are not a member of this room."));
    }

    /** Throws 403 unless the user holds at least one of the given roles in this room. */
    public RoomMember requireRole(Long roomId, Long userId, RoomRole... allowed) {
        RoomMember member = requireMember(roomId, userId);
        for (RoomRole role : allowed) {
            if (member.getRole() == role) return member;
        }
        throw new AccessDeniedException("You do not have the required role in this room.");
    }
}
