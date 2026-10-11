package com.hackathonos.backend.users;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "display_name")
    private String displayName;

    @Column(nullable = false, length = 100)
    private String timezone = "UTC";

    @Column(nullable = false, length = 20)
    private String theme = "system";

    @Column(name = "notify_deadlines", nullable = false)
    private boolean notifyDeadlines = true;

    @Column(name = "notify_mentions", nullable = false)
    private boolean notifyMentions = true;

    @Column(name = "notify_blocked", nullable = false)
    private boolean notifyBlocked = true;

    @Column(name = "notify_email", nullable = false)
    private boolean notifyEmail = false;

    @Column(nullable = false, length = 20)
    private String plan = "FREE";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected UserSettings() {}

    public UserSettings(UUID userId, String displayName) {
        this.userId = userId;
        this.displayName = displayName;
        this.timezone = "UTC";
        this.theme = "system";
        this.notifyDeadlines = true;
        this.notifyMentions = true;
        this.notifyBlocked = true;
        this.notifyEmail = false;
        this.plan = "FREE";
        this.updatedAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public boolean isNotifyDeadlines() { return notifyDeadlines; }
    public void setNotifyDeadlines(boolean notifyDeadlines) { this.notifyDeadlines = notifyDeadlines; }

    public boolean isNotifyMentions() { return notifyMentions; }
    public void setNotifyMentions(boolean notifyMentions) { this.notifyMentions = notifyMentions; }

    public boolean isNotifyBlocked() { return notifyBlocked; }
    public void setNotifyBlocked(boolean notifyBlocked) { this.notifyBlocked = notifyBlocked; }

    public boolean isNotifyEmail() { return notifyEmail; }
    public void setNotifyEmail(boolean notifyEmail) { this.notifyEmail = notifyEmail; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
