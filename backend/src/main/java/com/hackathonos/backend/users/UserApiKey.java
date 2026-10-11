package com.hackathonos.backend.users;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_api_keys")
public class UserApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(name = "key_encrypted", nullable = false, columnDefinition = "TEXT")
    private String keyEncrypted;

    @Column(nullable = false, length = 4)
    private String last4;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    protected UserApiKey() {}

    public UserApiKey(UUID userId, String provider, String label, String keyEncrypted, String last4) {
        this.userId = userId;
        this.provider = provider;
        this.label = label;
        this.keyEncrypted = keyEncrypted;
        this.last4 = last4;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getKeyEncrypted() { return keyEncrypted; }
    public void setKeyEncrypted(String keyEncrypted) { this.keyEncrypted = keyEncrypted; }

    public String getLast4() { return last4; }
    public void setLast4(String last4) { this.last4 = last4; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(Instant lastUsedAt) { this.lastUsedAt = lastUsedAt; }
}
