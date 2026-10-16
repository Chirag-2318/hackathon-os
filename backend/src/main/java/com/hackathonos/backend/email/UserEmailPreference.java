package com.hackathonos.backend.email;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "user_email_prefs")
@IdClass(UserEmailPreference.UserEmailPreferenceId.class)
public class UserEmailPreference {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserEmailPreference() {}

    public UserEmailPreference(UUID userId, String category, boolean enabled, Instant updatedAt) {
        this.userId = userId;
        this.category = category;
        this.enabled = enabled;
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static class UserEmailPreferenceId implements Serializable {
        private UUID userId;
        private String category;

        public UserEmailPreferenceId() {}

        public UserEmailPreferenceId(UUID userId, String category) {
            this.userId = userId;
            this.category = category;
        }

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof UserEmailPreferenceId that)) return false;
            return Objects.equals(userId, that.userId) && Objects.equals(category, that.category);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, category);
        }
    }
}
