package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class RoomAccess {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final CurrentUser currentUser;

    @Autowired
    public RoomAccess(RoomRepository roomRepository,
                      RoomMemberRepository roomMemberRepository,
                      CurrentUser currentUser) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.currentUser = currentUser;
    }

    public RoomAccess(RoomRepository roomRepository, RoomMemberRepository roomMemberRepository) {
        this(roomRepository, roomMemberRepository, null);
    }

    /**
     * Verifies that the room exists, is not archived, and that the user is an active member.
     * Throws NotFoundException if missing or ForbiddenException if not a member.
     */
    public RoomMember requireMember(UUID roomId, User user) {
        if (user == null && currentUser != null) {
            user = currentUser.get();
        }
        Room room = roomRepository.findByIdAndArchivedAtIsNull(roomId)
                .orElseThrow(() -> new NotFoundException("ROOM_NOT_FOUND", "Room not found or has been archived"));

        return roomMemberRepository.findByRoomIdAndUserId(room.getId(), user != null ? user.getId() : null)
                .orElseThrow(() -> new ForbiddenException("NOT_A_MEMBER", "You are not a member of this room"));
    }

    /**
     * Verifies that the room exists, is not archived, and that the user has the LEADER role.
     * Throws NotFoundException if missing or ForbiddenException if not a leader.
     */
    public RoomMember requireLeader(UUID roomId, User user) {
        if (user == null && currentUser != null) {
            user = currentUser.get();
        }
        RoomMember member = requireMember(roomId, user);
        if (!"LEADER".equalsIgnoreCase(member.getRole())) {
            throw new ForbiddenException("LEADER_REQUIRED", "Only the room leader can perform this action");
        }
        return member;
    }

    /**
     * Loads the active room or throws NotFoundException.
     */
    public Room getActiveRoomOrThrow(UUID roomId) {
        return roomRepository.findByIdAndArchivedAtIsNull(roomId)
                .orElseThrow(() -> new NotFoundException("ROOM_NOT_FOUND", "Room not found or has been archived"));
    }
}
