package com.hackathonos.backend.schedule;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "schedule_events")
public class ScheduleEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "kind", nullable = false, length = 30)
    private String kind; // 'MILESTONE', 'SYNC', 'CHECKPOINT', 'DEADLINE'

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    public ScheduleEvent() {}

    public ScheduleEvent(UUID roomId, String title, String kind, Instant startsAt, Instant endsAt, String notes, UUID createdBy) {
        this.roomId = roomId;
        this.title = title;
        this.kind = kind;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.notes = notes != null ? notes : "";
        this.createdBy = createdBy;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public Instant getStartsAt() { return startsAt; }
    public void setStartsAt(Instant startsAt) { this.startsAt = startsAt; }

    public Instant getEndsAt() { return endsAt; }
    public void setEndsAt(Instant endsAt) { this.endsAt = endsAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
}
