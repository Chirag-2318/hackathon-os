package com.hackathonos.backend.pitch;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "pitch_slides")
public class PitchSlide {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "position", nullable = false)
    private int position;

    @Column(name = "kind", nullable = false, length = 30)
    private String kind; // 'PROBLEM', 'SOLUTION', 'DEMO', 'IMPACT', 'NEXT', 'TEAM', 'TECH', 'CUSTOM'

    @Column(name = "title", nullable = false, columnDefinition = "text")
    private String title;

    @Column(name = "question", nullable = false, columnDefinition = "text")
    private String question;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    public PitchSlide() {}

    public PitchSlide(UUID roomId, int position, String kind, String title, String question, String content) {
        this.roomId = roomId;
        this.position = position;
        this.kind = kind;
        this.title = title;
        this.question = question;
        this.content = content != null ? content : "";
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
