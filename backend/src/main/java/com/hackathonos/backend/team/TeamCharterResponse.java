package com.hackathonos.backend.team;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "team_charter_responses", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"room_id", "user_id"})
})
public class TeamCharterResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 20)
    private String goal = "WIN"; // WIN, LEARN, PORTFOLIO, ALL

    @Column(name = "hours_available", nullable = false)
    private int hoursAvailable = 0;

    @Column(name = "norms_acknowledged", nullable = false)
    private boolean normsAcknowledged = false;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected TeamCharterResponse() {}

    public TeamCharterResponse(UUID roomId, UUID userId, String goal, int hoursAvailable, boolean normsAcknowledged) {
        this.roomId = roomId;
        this.userId = userId;
        this.goal = goal != null ? goal : "WIN";
        this.hoursAvailable = Math.max(0, hoursAvailable);
        this.normsAcknowledged = normsAcknowledged;
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public int getHoursAvailable() { return hoursAvailable; }
    public void setHoursAvailable(int hoursAvailable) { this.hoursAvailable = hoursAvailable; }

    public boolean isNormsAcknowledged() { return normsAcknowledged; }
    public void setNormsAcknowledged(boolean normsAcknowledged) { this.normsAcknowledged = normsAcknowledged; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
