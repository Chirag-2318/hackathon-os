package com.hackathonos.backend.diagrams;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "diagrams")
public class Diagram {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "title", nullable = false, length = 80)
    private String title;

    @Column(name = "kind", nullable = false, length = 30)
    private String kind; // 'architecture', 'userflow', 'sequence', 'er', 'roadmap'

    @Column(name = "mermaid_source", nullable = false, columnDefinition = "TEXT")
    private String mermaidSource;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Diagram() {}

    public Diagram(UUID roomId, String title, String kind, String mermaidSource, UUID createdBy, Instant createdAt, Instant updatedAt) {
        this.roomId = roomId;
        this.title = title;
        this.kind = kind;
        this.mermaidSource = mermaidSource;
        this.createdBy = createdBy;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public String getMermaidSource() { return mermaidSource; }
    public void setMermaidSource(String mermaidSource) { this.mermaidSource = mermaidSource; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
