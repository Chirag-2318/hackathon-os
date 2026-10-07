package com.hackathonos.backend.auth;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "users",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_users_provider",
                columnNames = {"provider", "provider_id"}
        ))
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_id", nullable = false)
    private String providerId;

    @Column
    private String email;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private OffsetDateTime createdAt;

    protected User() {
        // required by JPA, never called directly
    }

    public User(String provider, String providerId, String email, String displayName, String avatarUrl) {
        this.provider = provider;
        this.providerId = providerId;
        this.email = email;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
    }

    public Long getId() { return id; }
    public String getProvider() { return provider; }
    public String getProviderId() { return providerId; }
    public String getEmail() { return email; }
    public String getDisplayName() { return displayName; }
    public String getAvatarUrl() { return avatarUrl; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}