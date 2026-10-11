package com.hackathonos.backend.mentor;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mentor_questions")
public class MentorQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "mentor_link_id", nullable = false)
    private UUID mentorLinkId;

    @Column(name = "mentor_name", nullable = false, length = 80)
    private String mentorName;

    @Column(name = "question", nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(name = "answer", columnDefinition = "TEXT")
    private String answer;

    @Column(name = "status", nullable = false, length = 30)
    private String status; // 'OPEN', 'ANSWERED'

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "answered_at")
    private Instant answeredAt;

    @Column(name = "answered_by")
    private UUID answeredBy;

    public MentorQuestion() {}

    public MentorQuestion(UUID roomId, UUID mentorLinkId, String mentorName, String question, String status, Instant createdAt) {
        this.roomId = roomId;
        this.mentorLinkId = mentorLinkId;
        this.mentorName = mentorName;
        this.question = question;
        this.status = status != null ? status : "OPEN";
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public UUID getMentorLinkId() { return mentorLinkId; }
    public void setMentorLinkId(UUID mentorLinkId) { this.mentorLinkId = mentorLinkId; }

    public String getMentorName() { return mentorName; }
    public void setMentorName(String mentorName) { this.mentorName = mentorName; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getAnsweredAt() { return answeredAt; }
    public void setAnsweredAt(Instant answeredAt) { this.answeredAt = answeredAt; }

    public UUID getAnsweredBy() { return answeredBy; }
    public void setAnsweredBy(UUID answeredBy) { this.answeredBy = answeredBy; }
}
