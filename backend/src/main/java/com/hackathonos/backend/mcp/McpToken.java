package com.hackathonos.backend.mcp;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mcp_tokens", indexes = {
        @Index(name = "idx_mcp_tokens_user_id", columnList = "user_id"),
        @Index(name = "idx_mcp_tokens_token_hash", columnList = "token_hash"),
        @Index(name = "idx_mcp_tokens_family_id", columnList = "family_id"),
        @Index(name = "idx_mcp_tokens_auth_code_hash", columnList = "auth_code_hash")
})
public class McpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false, length = 10)
    private String kind; // 'ACCESS' or 'REFRESH'

    @Column(name = "client_id", length = 200)
    private String clientId;

    @Column(nullable = false, length = 50)
    private String scope = "mcp";

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "family_id")
    private UUID familyId;

    @Column(name = "rotated_at")
    private Instant rotatedAt;

    @Column(name = "auth_code_hash", length = 64)
    private String authCodeHash;

    protected McpToken() {}

    public McpToken(UUID userId, String tokenHash, String kind, String clientId, String scope, Instant expiresAt) {
        this.userId = userId;
        this.tokenHash = tokenHash;
        this.kind = kind;
        this.clientId = clientId;
        this.scope = scope != null && !scope.isBlank() ? scope : "mcp";
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }

    public McpToken(UUID userId, String tokenHash, String kind, String clientId, String scope, Instant expiresAt, UUID familyId, String authCodeHash) {
        this(userId, tokenHash, kind, clientId, scope, expiresAt);
        this.familyId = familyId;
        this.authCodeHash = authCodeHash;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(Instant revokedAt) {
        this.revokedAt = revokedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getLastUsedAt() {
        return lastUsedAt;
    }

    public void setLastUsedAt(Instant lastUsedAt) {
        this.lastUsedAt = lastUsedAt;
    }

    public UUID getFamilyId() {
        return familyId;
    }

    public void setFamilyId(UUID familyId) {
        this.familyId = familyId;
    }

    public Instant getRotatedAt() {
        return rotatedAt;
    }

    public void setRotatedAt(Instant rotatedAt) {
        this.rotatedAt = rotatedAt;
    }

    public String getAuthCodeHash() {
        return authCodeHash;
    }

    public void setAuthCodeHash(String authCodeHash) {
        this.authCodeHash = authCodeHash;
    }
}
