package com.hackathonos.backend.pitchkit;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "qna_session_answers")
public class QnaSessionAnswer {

    @Id
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "hash", nullable = false, length = 64)
    private String hash;

    @Column(name = "rating")
    private Integer rating; // 1..3

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;

    @Column(name = "transcript", columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "followup_shown", nullable = false)
    private boolean followupShown = false;

    @Column(name = "covered_points", columnDefinition = "JSONB")
    private String coveredPoints;

    @Column(name = "ai_score")
    private Integer aiScore;

    @Column(name = "ai_note", columnDefinition = "TEXT")
    private String aiNote;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public QnaSessionAnswer() {}

    public QnaSessionAnswer(UUID id, UUID sessionId, String hash, Integer rating, String answerText,
                            String transcript, Long durationMs, boolean followupShown, String coveredPoints) {
        this.id = id != null ? id : UUID.randomUUID();
        this.sessionId = sessionId;
        this.hash = hash;
        this.rating = rating;
        this.answerText = answerText;
        this.transcript = transcript;
        this.durationMs = durationMs;
        this.followupShown = followupShown;
        this.coveredPoints = coveredPoints;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }

    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }

    public String getTranscript() { return transcript; }
    public void setTranscript(String transcript) { this.transcript = transcript; }

    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }

    public boolean isFollowupShown() { return followupShown; }
    public void setFollowupShown(boolean followupShown) { this.followupShown = followupShown; }

    public String getCoveredPoints() { return coveredPoints; }
    public void setCoveredPoints(String coveredPoints) { this.coveredPoints = coveredPoints; }

    public Integer getAiScore() { return aiScore; }
    public void setAiScore(Integer aiScore) { this.aiScore = aiScore; }

    public String getAiNote() { return aiNote; }
    public void setAiNote(String aiNote) { this.aiNote = aiNote; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
