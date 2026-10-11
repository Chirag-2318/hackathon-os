package com.hackathonos.backend.portfolio;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "portfolio_settings")
public class PortfolioSettings {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "slug", unique = true, length = 50)
    private String slug;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic;

    public PortfolioSettings() {}

    public PortfolioSettings(UUID userId, String slug, boolean isPublic) {
        this.userId = userId;
        this.slug = slug;
        this.isPublic = isPublic;
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }
}
