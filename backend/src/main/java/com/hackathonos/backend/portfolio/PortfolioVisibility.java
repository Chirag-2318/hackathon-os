package com.hackathonos.backend.portfolio;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "portfolio_visibility")
@IdClass(PortfolioVisibility.PortfolioVisibilityId.class)
public class PortfolioVisibility {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "visible", nullable = false)
    private boolean visible = true;

    @Column(name = "is_pinned", nullable = false)
    private boolean pinned = false;

    @Column(name = "pin_order", nullable = false)
    private int pinOrder = 0;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public PortfolioVisibility() {}

    public PortfolioVisibility(UUID userId, UUID roomId, boolean visible) {
        this.userId = userId;
        this.roomId = roomId;
        this.visible = visible;
        this.pinned = false;
        this.pinOrder = 0;
        this.updatedAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public boolean isVisible() { return visible; }
    public void setVisible(boolean visible) { this.visible = visible; }

    public boolean isPinned() { return pinned; }
    public void setPinned(boolean pinned) { this.pinned = pinned; }

    public int getPinOrder() { return pinOrder; }
    public void setPinOrder(int pinOrder) { this.pinOrder = pinOrder; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static class PortfolioVisibilityId implements Serializable {
        private UUID userId;
        private UUID roomId;

        public PortfolioVisibilityId() {}
        public PortfolioVisibilityId(UUID userId, UUID roomId) {
            this.userId = userId;
            this.roomId = roomId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            PortfolioVisibilityId that = (PortfolioVisibilityId) o;
            return Objects.equals(userId, that.userId) && Objects.equals(roomId, that.roomId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, roomId);
        }
    }
}
