package com.hackathonos.backend.pitchkit;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pitch_versions")
public class PitchVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "version", nullable = false)
    private int version;

    @Column(name = "beats", nullable = false, columnDefinition = "jsonb")
    private String beats = "[]";

    @Column(name = "note")
    private String note;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public PitchVersion() {}

    public PitchVersion(UUID roomId, int version, String beats, String note, UUID createdBy) {
        this.id = UUID.randomUUID();
        this.roomId = roomId;
        this.version = version;
        this.beats = beats;
        this.note = note;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }

    public String getBeats() { return beats; }
    public void setBeats(String beats) { this.beats = beats; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
