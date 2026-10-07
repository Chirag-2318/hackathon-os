package com.hackathonos.backend.room;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "invites")
public class Invite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "used_at")
    private OffsetDateTime usedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Invite() {}

    public Invite(Long roomId, String token, OffsetDateTime expiresAt) {
        this.roomId = roomId;
        this.token = token;
        this.expiresAt = expiresAt;
    }

    public Long getId() { return id; }
    public Long getRoomId() { return roomId; }
    public String getToken() { return token; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public OffsetDateTime getUsedAt() { return usedAt; }
    public void setUsedAt(OffsetDateTime usedAt) { this.usedAt = usedAt; }
}
