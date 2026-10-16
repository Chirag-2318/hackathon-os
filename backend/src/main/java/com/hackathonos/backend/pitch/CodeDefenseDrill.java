package com.hackathonos.backend.pitch;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "code_defense_drills")
public class CodeDefenseDrill {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "module", nullable = false, columnDefinition = "text")
    private String module;

    @Column(name = "question", nullable = false, columnDefinition = "text")
    private String question;

    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(name = "practiced_at")
    private Instant practicedAt;

    public CodeDefenseDrill() {}

    public CodeDefenseDrill(UUID roomId, String module, String question, UUID ownerId, Instant practicedAt) {
        this.roomId = roomId;
        this.module = module;
        this.question = question;
        this.ownerId = ownerId;
        this.practicedAt = practicedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public Instant getPracticedAt() { return practicedAt; }
    public void setPracticedAt(Instant practicedAt) { this.practicedAt = practicedAt; }
}
