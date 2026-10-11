package com.hackathonos.backend.apihub;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "api_mock_settings")
public class ApiMockSettings {

    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "token", nullable = false, length = 64, unique = true)
    private String token;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public ApiMockSettings() {}

    public ApiMockSettings(UUID roomId, boolean enabled, String token, Instant updatedAt) {
        this.roomId = roomId;
        this.enabled = enabled;
        this.token = token;
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
