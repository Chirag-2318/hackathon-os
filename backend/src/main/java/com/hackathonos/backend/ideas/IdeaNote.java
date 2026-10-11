package com.hackathonos.backend.ideas;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "idea_notes")
public class IdeaNote {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "idea_id", nullable = false)
    private UUID ideaId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    protected IdeaNote() {}

    public IdeaNote(UUID ideaId, String text) {
        this.ideaId = ideaId;
        this.text = text;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getIdeaId() { return ideaId; }
    public void setIdeaId(UUID ideaId) { this.ideaId = ideaId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
