package com.hackathonos.backend.hackathons;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hackathon_suggestions", indexes = {
        @Index(name = "idx_hackathon_suggestions_url", columnList = "url"),
        @Index(name = "idx_hackathon_suggestions_user_id", columnList = "user_id")
})
public class HackathonSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(length = 300)
    private String note;

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public HackathonSuggestion() {}

    public HackathonSuggestion(UUID userId, String url, String note) {
        this.userId = userId;
        this.url = url;
        this.note = note;
        this.status = "PENDING";
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
