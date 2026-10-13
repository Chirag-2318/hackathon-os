package com.hackathonos.backend.users;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_users_provider",
                columnNames = {"provider", "provider_user_id"}
        ))
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_user_id", nullable = false)
    private String providerUserId;

    @Column(nullable = false)
    private String name;

    @Column
    private String email;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column
    private String login;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(length = 20)
    private String username;

    @Column(name = "avatar_type", length = 20)
    private String avatarType = "PRESET";

    @Column(name = "avatar_preset")
    private Integer avatarPreset;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "role_tags", columnDefinition = "jsonb")
    private String roleTags = "[]";

    @Column(name = "experience_level", length = 20)
    private String experienceLevel;

    @Column(name = "goal", length = 20)
    private String goal;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tech_stack", columnDefinition = "jsonb")
    private String techStack = "[]";

    @Column(name = "onboarding_completed", nullable = false)
    private boolean onboardingCompleted = false;

    @Column(name = "onboarded_at")
    private Instant onboardedAt;

    @Column(name = "tour_status", length = 20, nullable = false)
    private String tourStatus = "NOT_STARTED";

    @Column(name = "tour_path", length = 20)
    private String tourPath;

    @Column(name = "tour_version", nullable = false)
    private int tourVersion = 0;

    @Column(name = "tour_completed_at")
    private Instant tourCompletedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "hotspots_seen", columnDefinition = "jsonb")
    private String hotspotsSeen = "[]";

    protected User() {}

    public User(String provider, String providerUserId, String name, String email, String avatarUrl, String login) {
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.name = name;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.login = login;
        this.createdAt = Instant.now();
        this.lastLoginAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getProviderUserId() { return providerUserId; }
    public void setProviderUserId(String providerUserId) { this.providerUserId = providerUserId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getAvatarType() { return avatarType; }
    public void setAvatarType(String avatarType) { this.avatarType = avatarType; }

    public Integer getAvatarPreset() { return avatarPreset; }
    public void setAvatarPreset(Integer avatarPreset) { this.avatarPreset = avatarPreset; }

    public String getRoleTags() { return roleTags; }
    public void setRoleTags(String roleTags) { this.roleTags = roleTags; }

    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public String getTechStack() { return techStack; }
    public void setTechStack(String techStack) { this.techStack = techStack; }

    public boolean isOnboardingCompleted() { return onboardingCompleted; }
    public void setOnboardingCompleted(boolean onboardingCompleted) { this.onboardingCompleted = onboardingCompleted; }

    public Instant getOnboardedAt() { return onboardedAt; }
    public void setOnboardedAt(Instant onboardedAt) { this.onboardedAt = onboardedAt; }

    public String getTourStatus() { return tourStatus; }
    public void setTourStatus(String tourStatus) { this.tourStatus = tourStatus; }

    public String getTourPath() { return tourPath; }
    public void setTourPath(String tourPath) { this.tourPath = tourPath; }

    public int getTourVersion() { return tourVersion; }
    public void setTourVersion(int tourVersion) { this.tourVersion = tourVersion; }

    public Instant getTourCompletedAt() { return tourCompletedAt; }
    public void setTourCompletedAt(Instant tourCompletedAt) { this.tourCompletedAt = tourCompletedAt; }

    public String getHotspotsSeen() { return hotspotsSeen; }
    public void setHotspotsSeen(String hotspotsSeen) { this.hotspotsSeen = hotspotsSeen; }
}
