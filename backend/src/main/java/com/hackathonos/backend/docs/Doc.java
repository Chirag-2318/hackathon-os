package com.hackathonos.backend.docs;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "docs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"room_id", "file_name"})
})
public class Doc {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "file_name", nullable = false, length = 100)
    private String fileName;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "current_version", nullable = false)
    private int currentVersion = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "last_edited_by")
    private UUID lastEditedBy;

    @Column(name = "source", length = 50)
    private String source = "PLAN";

    protected Doc() {}


    public Doc(UUID roomId, String fileName, String title, int currentVersion) {
        this.roomId = roomId;
        this.fileName = fileName;
        this.title = title;
        this.currentVersion = currentVersion;
        this.source = "PLAN";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public int getCurrentVersion() { return currentVersion; }
    public void setCurrentVersion(int currentVersion) { this.currentVersion = currentVersion; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public UUID getLastEditedBy() { return lastEditedBy; }
    public void setLastEditedBy(UUID lastEditedBy) { this.lastEditedBy = lastEditedBy; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}

