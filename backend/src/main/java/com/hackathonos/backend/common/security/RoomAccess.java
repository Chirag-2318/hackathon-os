package com.hackathonos.backend.common.security;

import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomAccessService;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Adapter delegating to central RoomAccessService to ensure backwards compatibility.
 */
@Service
public class RoomAccess {

    private final RoomAccessService accessService;

    public RoomAccess(RoomAccessService accessService) {
        this.accessService = accessService;
    }

    public RoomMember requireMember(UUID roomId, User user) {
        return accessService.requireMember(roomId, user);
    }

    public RoomMember requireMember(UUID roomId, UUID userId) {
        return accessService.requireMember(roomId, userId);
    }

    public RoomMember requireLeader(UUID roomId, User user) {
        return accessService.requireLeader(roomId, user);
    }

    public RoomMember requireLeader(UUID roomId, UUID userId) {
        return accessService.requireLeader(roomId, userId);
    }

    public Room getActiveRoomOrThrow(UUID roomId) {
        return accessService.getActiveRoomOrThrow(roomId);
    }

    public boolean isMember(UUID roomId, UUID userId) {
        return accessService.isMember(roomId, userId);
    }

    public boolean isLeader(UUID roomId, UUID userId) {
        return accessService.isLeader(roomId, userId);
    }
}
