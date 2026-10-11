package com.hackathonos.backend.demo;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "demo_shots")
public class DemoShot {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "position", nullable = false)
    private int position;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "duration_sec", nullable = false)
    private int durationSec;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "done", nullable = false)
    private boolean done;

    public DemoShot() {}

    public DemoShot(UUID roomId, int position, String title, int durationSec, String notes, boolean done) {
        this.roomId = roomId;
        this.position = position;
        this.title = title;
        this.durationSec = durationSec;
        this.notes = notes != null ? notes : "";
        this.done = done;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public int getDurationSec() { return durationSec; }
    public void setDurationSec(int durationSec) { this.durationSec = durationSec; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }
}
