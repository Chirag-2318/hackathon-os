package com.hackathonos.backend.prep;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "prep_items")
public class PrepItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "position", nullable = false)
    private int position;

    @Column(name = "label", nullable = false, length = 255)
    private String label;

    @Column(name = "done", nullable = false)
    private boolean done;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "done_by")
    private UUID doneBy;

    public PrepItem() {}

    public PrepItem(UUID roomId, int position, String label, boolean done, Instant dueAt, UUID doneBy) {
        this.roomId = roomId;
        this.position = position;
        this.label = label;
        this.done = done;
        this.dueAt = dueAt;
        this.doneBy = doneBy;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }

    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }

    public UUID getDoneBy() { return doneBy; }
    public void setDoneBy(UUID doneBy) { this.doneBy = doneBy; }
}
