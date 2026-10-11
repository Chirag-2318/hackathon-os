package com.hackathonos.backend.github;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "github_attention_dismissals")
@IdClass(GithubAttentionDismissal.GithubAttentionDismissalId.class)
public class GithubAttentionDismissal {

    @Id
    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Id
    @Column(name = "item_key", nullable = false, length = 50)
    private String itemKey;

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "dismissed_at", nullable = false)
    private Instant dismissedAt;

    public GithubAttentionDismissal() {}

    public GithubAttentionDismissal(UUID roomId, String itemKey, UUID userId, Instant dismissedAt) {
        this.roomId = roomId;
        this.itemKey = itemKey;
        this.userId = userId;
        this.dismissedAt = dismissedAt != null ? dismissedAt : Instant.now();
    }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getItemKey() { return itemKey; }
    public void setItemKey(String itemKey) { this.itemKey = itemKey; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Instant getDismissedAt() { return dismissedAt; }
    public void setDismissedAt(Instant dismissedAt) { this.dismissedAt = dismissedAt; }

    public static class GithubAttentionDismissalId implements Serializable {
        private UUID roomId;
        private String itemKey;
        private UUID userId;

        public GithubAttentionDismissalId() {}

        public GithubAttentionDismissalId(UUID roomId, String itemKey, UUID userId) {
            this.roomId = roomId;
            this.itemKey = itemKey;
            this.userId = userId;
        }

        public UUID getRoomId() { return roomId; }
        public void setRoomId(UUID roomId) { this.roomId = roomId; }

        public String getItemKey() { return itemKey; }
        public void setItemKey(String itemKey) { this.itemKey = itemKey; }

        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof GithubAttentionDismissalId that)) return false;
            return Objects.equals(roomId, that.roomId) &&
                    Objects.equals(itemKey, that.itemKey) &&
                    Objects.equals(userId, that.userId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(roomId, itemKey, userId);
        }
    }
}
