package com.hackathonos.backend.room;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "room_members", uniqueConstraints = @UniqueConstraint(
        name = "uq_room_member", columnNames = {"room_id", "user_id"}))
public class RoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomRole role;

    @Column(name = "joined_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime joinedAt;

    protected RoomMember() {}

    public RoomMember(Long roomId, Long userId, RoomRole role) {
        this.roomId = roomId;
        this.userId = userId;
        this.role = role;
    }

    public Long getId() { return id; }
    public Long getRoomId() { return roomId; }
    public Long getUserId() { return userId; }
    public RoomRole getRole() { return role; }
    public OffsetDateTime getJoinedAt() { return joinedAt; }
    public void setRole(RoomRole role) { this.role = role; }
}
