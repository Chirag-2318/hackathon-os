package com.hackathonos.backend.pitch;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "pitch_qa")
public class PitchQa {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "position", nullable = false)
    private int position;

    @Column(name = "question", nullable = false, columnDefinition = "text")
    private String question;

    @Column(name = "answer", columnDefinition = "TEXT")
    private String answer;

    @Column(name = "category", nullable = false, length = 30)
    private String category; // 'PRODUCT', 'TECH', 'IMPACT', 'TEAM', 'PROCESS'

    @Column(name = "source", nullable = false, length = 30)
    private String source; // 'GENERATED', 'MANUAL'

    @Column(name = "practiced", nullable = false)
    private boolean practiced;

    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(name = "why_asked", columnDefinition = "TEXT")
    private String whyAsked;

    @Column(name = "risk_point", columnDefinition = "TEXT")
    private String riskPoint;

    @Column(name = "difficulty", nullable = false)
    private int difficulty = 1;

    public PitchQa() {}

    public PitchQa(UUID roomId, int position, String question, String answer, String category, String source, boolean practiced, UUID ownerId) {
        this.roomId = roomId;
        this.position = position;
        this.question = question;
        this.answer = answer != null ? answer : "";
        this.category = category;
        this.source = source != null ? source : "MANUAL";
        this.practiced = practiced;
        this.ownerId = ownerId;
        this.difficulty = 1;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public boolean isPracticed() { return practiced; }
    public void setPracticed(boolean practiced) { this.practiced = practiced; }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public String getWhyAsked() { return whyAsked; }
    public void setWhyAsked(String whyAsked) { this.whyAsked = whyAsked; }

    public String getRiskPoint() { return riskPoint; }
    public void setRiskPoint(String riskPoint) { this.riskPoint = riskPoint; }

    public int getDifficulty() { return difficulty; }
    public void setDifficulty(int difficulty) { this.difficulty = difficulty; }
}
