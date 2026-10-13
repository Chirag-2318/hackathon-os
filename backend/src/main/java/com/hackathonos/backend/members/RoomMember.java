package com.hackathonos.backend.members;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "room_members",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_room_members_room_user",
                columnNames = {"room_id", "user_id"}
        ))
public class RoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 30)
    private String role;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt = Instant.now();

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(name = "last_visited_at")
    private Instant lastVisitedAt;

    protected RoomMember() {}

    public RoomMember(UUID roomId, UUID userId, String role) {
        this.roomId = roomId;
        this.userId = userId;
        this.role = role;
        this.status = "ACTIVE";
        this.joinedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }

    public Instant getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(Instant lastSeenAt) { this.lastSeenAt = lastSeenAt; }

    public Instant getLastVisitedAt() { return lastVisitedAt; }
    public void setLastVisitedAt(Instant lastVisitedAt) { this.lastVisitedAt = lastVisitedAt; }
}
