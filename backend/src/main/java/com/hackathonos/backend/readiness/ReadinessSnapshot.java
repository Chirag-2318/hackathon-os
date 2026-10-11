package com.hackathonos.backend.readiness;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "readiness_snapshots")
public class ReadinessSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "score", nullable = false)
    private int score;

    @Column(name = "breakdown", columnDefinition = "jsonb")
    private String breakdown;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public ReadinessSnapshot() {}

    public ReadinessSnapshot(UUID roomId, int score, String breakdown, Instant createdAt) {
        this.roomId = roomId;
        this.score = score;
        this.breakdown = breakdown != null ? breakdown : "{}";
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public String getBreakdown() { return breakdown; }
    public void setBreakdown(String breakdown) { this.breakdown = breakdown; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
