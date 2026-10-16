package com.hackathonos.backend.invites;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "room_invites")
public class RoomInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "email_normalized", nullable = false, length = 255)
    private String emailNormalized;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "invited_by")
    private UUID invitedBy;

    @Column(length = 140)
    private String note;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "last_sent_at", nullable = false)
    private Instant lastSentAt = Instant.now();

    @Column(name = "send_count", nullable = false)
    private int sendCount = 1;

    @Column(name = "accepted_by")
    private UUID acceptedBy;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    protected RoomInvite() {}

    public RoomInvite(UUID roomId, String emailNormalized, String tokenHash, UUID invitedBy, String note, Instant expiresAt) {
        this.roomId = roomId;
        this.emailNormalized = emailNormalized;
        this.tokenHash = tokenHash;
        this.invitedBy = invitedBy;
        this.note = note;
        this.expiresAt = expiresAt;
        this.status = "PENDING";
        this.createdAt = Instant.now();
        this.lastSentAt = Instant.now();
        this.sendCount = 1;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getEmailNormalized() { return emailNormalized; }
    public void setEmailNormalized(String emailNormalized) { this.emailNormalized = emailNormalized; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public UUID getInvitedBy() { return invitedBy; }
    public void setInvitedBy(UUID invitedBy) { this.invitedBy = invitedBy; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getLastSentAt() { return lastSentAt; }
    public void setLastSentAt(Instant lastSentAt) { this.lastSentAt = lastSentAt; }

    public int getSendCount() { return sendCount; }
    public void setSendCount(int sendCount) { this.sendCount = sendCount; }

    public UUID getAcceptedBy() { return acceptedBy; }
    public void setAcceptedBy(UUID acceptedBy) { this.acceptedBy = acceptedBy; }

    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }
}
