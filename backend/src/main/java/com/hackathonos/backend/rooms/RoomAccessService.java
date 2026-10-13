package com.hackathonos.backend.rooms;

import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.users.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Centralized service for validating room existence and user membership/leadership.
 * Returns 404 for non-existent or soft-deleted/archived rooms, and 403 for non-members.
 */
@Service
public class RoomAccessService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final CurrentUser currentUser;

    @Autowired
    public RoomAccessService(RoomRepository roomRepository,
                             RoomMemberRepository roomMemberRepository,
                             CurrentUser currentUser) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.currentUser = currentUser;
    }

    public RoomAccessService(RoomRepository roomRepository, RoomMemberRepository roomMemberRepository) {
        this(roomRepository, roomMemberRepository, null);
    }

    public Room getActiveRoomOrThrow(UUID roomId) {
        if (roomId == null) {
            throw new NotFoundException("ROOM_NOT_FOUND", "Room ID is required");
        }
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("ROOM_NOT_FOUND", "Room not found"));
        if (room.getDeletedAt() != null || room.getArchivedAt() != null) {
            throw new NotFoundException("ROOM_NOT_FOUND", "Room not found or has been archived");
        }
        return room;
    }

    public RoomMember requireMember(UUID roomId, UUID userId) {
        Room room = getActiveRoomOrThrow(roomId);
        if (userId == null && currentUser != null && currentUser.get() != null) {
            userId = currentUser.get().getId();
        }
        if (userId == null) {
            throw new ForbiddenException("NOT_A_MEMBER", "Authentication required");
        }
        return roomMemberRepository.findByRoomIdAndUserId(room.getId(), userId)
                .orElseThrow(() -> new ForbiddenException("NOT_A_MEMBER", "You are not a member of this room"));
    }

    public RoomMember requireMember(UUID roomId, User user) {
        UUID userId = user != null ? user.getId() : (currentUser != null && currentUser.get() != null ? currentUser.get().getId() : null);
        return requireMember(roomId, userId);
    }

    public RoomMember requireLeader(UUID roomId, UUID userId) {
        RoomMember member = requireMember(roomId, userId);
        if (!"LEADER".equalsIgnoreCase(member.getRole())) {
            throw new ForbiddenException("LEADER_REQUIRED", "Only the room leader can perform this action");
        }
        return member;
    }

    public RoomMember requireLeader(UUID roomId, User user) {
        UUID userId = user != null ? user.getId() : (currentUser != null && currentUser.get() != null ? currentUser.get().getId() : null);
        return requireLeader(roomId, userId);
    }

    public boolean isMember(UUID roomId, UUID userId) {
        if (roomId == null || userId == null) return false;
        return roomMemberRepository.existsByRoomIdAndUserId(roomId, userId);
    }

    public boolean isLeader(UUID roomId, UUID userId) {
        if (roomId == null || userId == null) return false;
        return roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .map(m -> "LEADER".equalsIgnoreCase(m.getRole()))
                .orElse(false);
    }
}
