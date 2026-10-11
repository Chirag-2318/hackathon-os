package com.hackathonos.backend.users;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "user_oauth_tokens")
@IdClass(UserOAuthToken.UserOAuthTokenId.class)
public class UserOAuthToken {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "provider", nullable = false, length = 20)
    private String provider;

    @Column(name = "access_token_encrypted", nullable = false, columnDefinition = "TEXT")
    private String accessTokenEncrypted;

    @Column(name = "scope")
    private String scope;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserOAuthToken() {}

    public UserOAuthToken(UUID userId, String provider, String accessTokenEncrypted, String scope, Instant updatedAt) {
        this.userId = userId;
        this.provider = provider;
        this.accessTokenEncrypted = accessTokenEncrypted;
        this.scope = scope;
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getAccessTokenEncrypted() {
        return accessTokenEncrypted;
    }

    public void setAccessTokenEncrypted(String accessTokenEncrypted) {
        this.accessTokenEncrypted = accessTokenEncrypted;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static class UserOAuthTokenId implements Serializable {
        private UUID userId;
        private String provider;

        public UserOAuthTokenId() {}

        public UserOAuthTokenId(UUID userId, String provider) {
            this.userId = userId;
            this.provider = provider;
        }

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getProvider() {
            return provider;
        }

        public void setProvider(String provider) {
            this.provider = provider;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof UserOAuthTokenId that)) return false;
            return Objects.equals(userId, that.userId) && Objects.equals(provider, that.provider);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, provider);
        }
    }
}
