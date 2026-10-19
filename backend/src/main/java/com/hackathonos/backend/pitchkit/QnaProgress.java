package com.hackathonos.backend.pitchkit;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "qna_progress")
@IdClass(QnaProgress.QnaProgressId.class)
public class QnaProgress {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Id
    @Column(name = "hash", nullable = false, length = 64)
    private String hash;

    @Column(name = "mastery", nullable = false)
    private int mastery = 0; // 0 UNSEEN, 1 MISSED, 2 SHAKY, 3 SOLID

    @Column(name = "times_seen", nullable = false)
    private int timesSeen = 0;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(name = "last_rating")
    private Integer lastRating;

    @Column(name = "last_answer_ms")
    private Long lastAnswerMs;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public QnaProgress() {}

    public QnaProgress(UUID userId, UUID roomId, String hash, int mastery) {
        this.userId = userId;
        this.roomId = roomId;
        this.hash = hash;
        this.mastery = mastery;
        this.timesSeen = 1;
        this.lastSeenAt = Instant.now();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }

    public int getMastery() { return mastery; }
    public void setMastery(int mastery) { this.mastery = mastery; }

    public int getTimesSeen() { return timesSeen; }
    public void setTimesSeen(int timesSeen) { this.timesSeen = timesSeen; }

    public Instant getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(Instant lastSeenAt) { this.lastSeenAt = lastSeenAt; }

    public Integer getLastRating() { return lastRating; }
    public void setLastRating(Integer lastRating) { this.lastRating = lastRating; }

    public Long getLastAnswerMs() { return lastAnswerMs; }
    public void setLastAnswerMs(Long lastAnswerMs) { this.lastAnswerMs = lastAnswerMs; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static class QnaProgressId implements Serializable {
        private UUID userId;
        private UUID roomId;
        private String hash;

        public QnaProgressId() {}

        public QnaProgressId(UUID userId, UUID roomId, String hash) {
            this.userId = userId;
            this.roomId = roomId;
            this.hash = hash;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof QnaProgressId that)) return false;
            return Objects.equals(userId, that.userId) &&
                   Objects.equals(roomId, that.roomId) &&
                   Objects.equals(hash, that.hash);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, roomId, hash);
        }
    }
}
