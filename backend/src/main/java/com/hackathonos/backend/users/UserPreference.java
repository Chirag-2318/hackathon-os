package com.hackathonos.backend.users;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_preferences")
public class UserPreference {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "theme", nullable = false, length = 32)
    private String theme = "system";

    @Column(name = "text_size", nullable = false, length = 32)
    private String textSize = "default";

    @Column(name = "motion", nullable = false, length = 32)
    private String motion = "system";

    @Column(name = "sidebar_default", nullable = false, length = 32)
    private String sidebarDefault = "expanded";

    @Column(name = "time_format", nullable = false, length = 32)
    private String timeFormat = "12h";

    @Column(name = "timezone", length = 100)
    private String timezone;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UserPreference() {}

    public UserPreference(UUID userId) {
        this.userId = userId;
        this.theme = "system";
        this.textSize = "default";
        this.motion = "system";
        this.sidebarDefault = "expanded";
        this.timeFormat = "12h";
        this.timezone = null;
        this.updatedAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public String getTextSize() { return textSize; }
    public void setTextSize(String textSize) { this.textSize = textSize; }

    public String getMotion() { return motion; }
    public void setMotion(String motion) { this.motion = motion; }

    public String getSidebarDefault() { return sidebarDefault; }
    public void setSidebarDefault(String sidebarDefault) { this.sidebarDefault = sidebarDefault; }

    public String getTimeFormat() { return timeFormat; }
    public void setTimeFormat(String timeFormat) { this.timeFormat = timeFormat; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
