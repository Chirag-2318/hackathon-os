package com.hackathonos.backend.common.security;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "oauth_link_states")
public class OAuthLinkState {

    @Id
    @Column(name = "state", length = 128, nullable = false)
    private String state;

    @Column(name = "provider", length = 32, nullable = false)
    private String provider;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "code_verifier", length = 256)
    private String codeVerifier;

    @Column(name = "return_path", length = 256)
    private String returnPath;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    public OAuthLinkState() {}

    public OAuthLinkState(String state, String provider, UUID userId, UUID roomId, String codeVerifier, String returnPath, Instant expiresAt) {
        this.state = state;
        this.provider = provider;
        this.userId = userId;
        this.roomId = roomId;
        this.codeVerifier = codeVerifier;
        this.returnPath = returnPath;
        this.createdAt = Instant.now();
        this.expiresAt = expiresAt;
    }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getCodeVerifier() { return codeVerifier; }
    public void setCodeVerifier(String codeVerifier) { this.codeVerifier = codeVerifier; }

    public String getReturnPath() { return returnPath; }
    public void setReturnPath(String returnPath) { this.returnPath = returnPath; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getUsedAt() { return usedAt; }
    public void setUsedAt(Instant usedAt) { this.usedAt = usedAt; }
}

