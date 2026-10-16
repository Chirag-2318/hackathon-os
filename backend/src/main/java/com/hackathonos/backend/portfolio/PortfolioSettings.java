package com.hackathonos.backend.portfolio;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "portfolio_settings")
public class PortfolioSettings {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "slug", unique = true, length = 60)
    private String slug;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic;

    @Column(name = "bio", columnDefinition = "text")
    private String bio;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_links", columnDefinition = "jsonb")
    private String customLinks = "[]";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public PortfolioSettings() {}

    public PortfolioSettings(UUID userId, String slug, boolean isPublic) {
        this.userId = userId;
        this.slug = slug;
        this.isPublic = isPublic;
        this.updatedAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getCustomLinks() { return customLinks; }
    public void setCustomLinks(String customLinks) { this.customLinks = customLinks != null ? customLinks : "[]"; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
