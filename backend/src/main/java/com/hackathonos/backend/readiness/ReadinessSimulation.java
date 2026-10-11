package com.hackathonos.backend.readiness;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "readiness_simulations")
public class ReadinessSimulation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "answers", columnDefinition = "jsonb")
    private String answers;

    @Column(name = "result", columnDefinition = "jsonb")
    private String result;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public ReadinessSimulation() {}

    public ReadinessSimulation(UUID roomId, UUID userId, String answers, String result, Instant createdAt) {
        this.roomId = roomId;
        this.userId = userId;
        this.answers = answers != null ? answers : "[]";
        this.result = result != null ? result : "{}";
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getAnswers() { return answers; }
    public void setAnswers(String answers) { this.answers = answers; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
