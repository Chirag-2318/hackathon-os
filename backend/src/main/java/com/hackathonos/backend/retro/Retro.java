package com.hackathonos.backend.retro;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "retros")
public class Retro {

    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "decision", length = 30)
    private String decision; // 'CONTINUE', 'ARCHIVE', or null

    @Column(name = "next_steps", columnDefinition = "TEXT")
    private String nextSteps;

    @Column(name = "result", columnDefinition = "TEXT")
    private String result;

    @Column(name = "portfolio_summary", columnDefinition = "TEXT")
    private String portfolioSummary;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Retro() {}

    public Retro(UUID roomId, String decision, String nextSteps, String result, String portfolioSummary, Instant updatedAt) {
        this.roomId = roomId;
        this.decision = decision;
        this.nextSteps = nextSteps;
        this.result = result;
        this.portfolioSummary = portfolioSummary;
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }

    public String getNextSteps() { return nextSteps; }
    public void setNextSteps(String nextSteps) { this.nextSteps = nextSteps; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public String getPortfolioSummary() { return portfolioSummary; }
    public void setPortfolioSummary(String portfolioSummary) { this.portfolioSummary = portfolioSummary; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
