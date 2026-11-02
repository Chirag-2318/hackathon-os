package com.hackathonos.backend.presence;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "room_presence", indexes = {
        @Index(name = "idx_room_presence_last_seen", columnList = "last_seen"),
        @Index(name = "idx_room_presence_room_last_seen", columnList = "room_id, last_seen")
})
@IdClass(RoomPresenceId.class)
public class RoomPresence {

    @Id
    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "last_seen", nullable = false)
    private Instant lastSeen = Instant.now();

    public RoomPresence() {}

    public RoomPresence(UUID roomId, UUID userId, Instant lastSeen) {
        this.roomId = roomId;
        this.userId = userId;
        this.lastSeen = lastSeen != null ? lastSeen : Instant.now();
    }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Instant getLastSeen() { return lastSeen; }
    public void setLastSeen(Instant lastSeen) { this.lastSeen = lastSeen; }
}

