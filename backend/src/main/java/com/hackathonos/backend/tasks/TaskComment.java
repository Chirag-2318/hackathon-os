package com.hackathonos.backend.tasks;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "task_comments")
public class TaskComment {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "author_id")
    private UUID authorId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "edited_at")
    private Instant editedAt;

    protected TaskComment() {}

    public TaskComment(UUID taskId, UUID authorId, String text) {
        this.taskId = taskId;
        this.authorId = authorId;
        this.text = text;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }

    public UUID getAuthorId() { return authorId; }
    public void setAuthorId(UUID authorId) { this.authorId = authorId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getEditedAt() { return editedAt; }
    public void setEditedAt(Instant editedAt) { this.editedAt = editedAt; }
}
