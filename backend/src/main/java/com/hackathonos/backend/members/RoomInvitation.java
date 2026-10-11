package com.hackathonos.backend.members;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "room_invitations")
public class RoomInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "invitee_text", nullable = false)
    private String inviteeText;

    @Column(nullable = false, length = 30)
    private String role;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "invited_by")
    private UUID invitedBy;

    @Column(name = "accepted_user_id")
    private UUID acceptedUserId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected RoomInvitation() {}

    public RoomInvitation(UUID roomId, String inviteeText, String role, UUID invitedBy) {
        this.roomId = roomId;
        this.inviteeText = inviteeText;
        this.role = role;
        this.status = "PENDING";
        this.invitedBy = invitedBy;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getInviteeText() { return inviteeText; }
    public void setInviteeText(String inviteeText) { this.inviteeText = inviteeText; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getInvitedBy() { return invitedBy; }
    public void setInvitedBy(UUID invitedBy) { this.invitedBy = invitedBy; }

    public UUID getAcceptedUserId() { return acceptedUserId; }
    public void setAcceptedUserId(UUID acceptedUserId) { this.acceptedUserId = acceptedUserId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
