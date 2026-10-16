package com.hackathonos.backend.ai;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_ai_keys")
public class UserAiKey {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 50)
    private String provider = "GROQ";

    @Column(name = "key_ciphertext", nullable = false, columnDefinition = "TEXT")
    private String keyCiphertext;

    @Column(nullable = false, length = 64)
    private String iv;

    @Column(name = "key_last4", nullable = false, length = 4)
    private String keyLast4;

    @Column(nullable = false, length = 30)
    private String status = "UNVERIFIED"; // UNVERIFIED, VALID, INVALID, RATE_LIMITED

    @Column(name = "last_checked_at")
    private Instant lastCheckedAt;

    @Column(name = "last_error", length = 200)
    private String lastError;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected UserAiKey() {}

    public UserAiKey(UUID userId, String provider, String keyCiphertext, String iv, String keyLast4, String status) {
        this.userId = userId;
        this.provider = provider != null ? provider : "GROQ";
        this.keyCiphertext = keyCiphertext;
        this.iv = iv;
        this.keyLast4 = keyLast4;
        this.status = status != null ? status : "UNVERIFIED";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getKeyCiphertext() { return keyCiphertext; }
    public void setKeyCiphertext(String keyCiphertext) { this.keyCiphertext = keyCiphertext; }

    public String getIv() { return iv; }
    public void setIv(String iv) { this.iv = iv; }

    public String getKeyLast4() { return keyLast4; }
    public void setKeyLast4(String keyLast4) { this.keyLast4 = keyLast4; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getLastCheckedAt() { return lastCheckedAt; }
    public void setLastCheckedAt(Instant lastCheckedAt) { this.lastCheckedAt = lastCheckedAt; }

    public String getLastError() { return lastError; }
    public void setLastError(String lastError) { this.lastError = lastError; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
