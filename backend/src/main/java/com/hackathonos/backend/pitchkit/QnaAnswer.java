package com.hackathonos.backend.pitchkit;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "qna_answers")
@IdClass(QnaAnswer.QnaAnswerId.class)
public class QnaAnswer {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Id
    @Column(name = "hash", nullable = false, length = 64)
    private String hash;

    @Column(name = "own_answer", columnDefinition = "TEXT")
    private String ownAnswer;

    @Column(name = "shared", nullable = false)
    private boolean shared = false;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public QnaAnswer() {}

    public QnaAnswer(UUID userId, UUID roomId, String hash, String ownAnswer, boolean shared) {
        this.userId = userId;
        this.roomId = roomId;
        this.hash = hash;
        this.ownAnswer = ownAnswer;
        this.shared = shared;
        this.updatedAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }

    public String getOwnAnswer() { return ownAnswer; }
    public void setOwnAnswer(String ownAnswer) { this.ownAnswer = ownAnswer; }

    public boolean isShared() { return shared; }
    public void setShared(boolean shared) { this.shared = shared; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static class QnaAnswerId implements Serializable {
        private UUID userId;
        private UUID roomId;
        private String hash;

        public QnaAnswerId() {}

        public QnaAnswerId(UUID userId, UUID roomId, String hash) {
            this.userId = userId;
            this.roomId = roomId;
            this.hash = hash;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof QnaAnswerId that)) return false;
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
