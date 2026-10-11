package com.hackathonos.backend.tasks;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "subtasks")
public class Subtask {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(nullable = false)
    private boolean done = false;

    @Column(nullable = false)
    private int position = 0;

    protected Subtask() {}

    public Subtask(UUID taskId, String text, boolean done, int position) {
        this.taskId = taskId;
        this.text = text;
        this.done = done;
        this.position = position;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
}
