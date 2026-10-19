package com.hackathonos.backend.pitch;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "qna_practice")
@IdClass(QnaPractice.QnaPracticeId.class)
public class QnaPractice {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Id
    @Column(name = "question_hash", nullable = false, length = 64)
    private String questionHash;

    @Column(name = "practiced_at", nullable = false)
    private Instant practicedAt = Instant.now();

    public QnaPractice() {}

    public QnaPractice(UUID userId, UUID roomId, String questionHash) {
        this.userId = userId;
        this.roomId = roomId;
        this.questionHash = questionHash;
        this.practicedAt = Instant.now();
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getRoomId() {
        return roomId;
    }

    public void setRoomId(UUID roomId) {
        this.roomId = roomId;
    }

    public String getQuestionHash() {
        return questionHash;
    }

    public void setQuestionHash(String questionHash) {
        this.questionHash = questionHash;
    }

    public Instant getPracticedAt() {
        return practicedAt;
    }

    public void setPracticedAt(Instant practicedAt) {
        this.practicedAt = practicedAt;
    }

    public static class QnaPracticeId implements Serializable {
        private UUID userId;
        private UUID roomId;
        private String questionHash;

        public QnaPracticeId() {}

        public QnaPracticeId(UUID userId, UUID roomId, String questionHash) {
            this.userId = userId;
            this.roomId = roomId;
            this.questionHash = questionHash;
        }

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public UUID getRoomId() {
            return roomId;
        }

        public void setRoomId(UUID roomId) {
            this.roomId = roomId;
        }

        public String getQuestionHash() {
            return questionHash;
        }

        public void setQuestionHash(String questionHash) {
            this.questionHash = questionHash;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof QnaPracticeId that)) return false;
            return Objects.equals(userId, that.userId) &&
                   Objects.equals(roomId, that.roomId) &&
                   Objects.equals(questionHash, that.questionHash);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, roomId, questionHash);
        }
    }
}
