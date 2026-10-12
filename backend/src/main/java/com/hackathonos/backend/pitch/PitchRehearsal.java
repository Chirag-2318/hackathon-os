package com.hackathonos.backend.pitch;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pitch_rehearsals")
public class PitchRehearsal {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "run_at", nullable = false)
    private Instant runAt;

    @Column(name = "duration_sec", nullable = false)
    private int durationSec;

    @Column(name = "presenter_id")
    private UUID presenterId;

    @Column(name = "operator_id")
    private UUID operatorId;

    @Column(name = "section_paces", columnDefinition = "jsonb")
    private String sectionPaces;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "stats", columnDefinition = "jsonb")
    private String stats;

    public PitchRehearsal() {}

    public PitchRehearsal(UUID roomId, Instant runAt, int durationSec, UUID presenterId, UUID operatorId, String sectionPaces, String notes) {
        this(roomId, runAt, durationSec, presenterId, operatorId, sectionPaces, notes, null);
    }

    public PitchRehearsal(UUID roomId, Instant runAt, int durationSec, UUID presenterId, UUID operatorId, String sectionPaces, String notes, String stats) {
        this.roomId = roomId;
        this.runAt = runAt != null ? runAt : Instant.now();
        this.durationSec = durationSec;
        this.presenterId = presenterId;
        this.operatorId = operatorId;
        this.sectionPaces = sectionPaces != null ? sectionPaces : "[]";
        this.notes = notes;
        this.stats = stats;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public Instant getRunAt() { return runAt; }
    public void setRunAt(Instant runAt) { this.runAt = runAt; }

    public int getDurationSec() { return durationSec; }
    public void setDurationSec(int durationSec) { this.durationSec = durationSec; }

    public UUID getPresenterId() { return presenterId; }
    public void setPresenterId(UUID presenterId) { this.presenterId = presenterId; }

    public UUID getOperatorId() { return operatorId; }
    public void setOperatorId(UUID operatorId) { this.operatorId = operatorId; }

    public String getSectionPaces() { return sectionPaces; }
    public void setSectionPaces(String sectionPaces) { this.sectionPaces = sectionPaces; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStats() { return stats; }
    public void setStats(String stats) { this.stats = stats; }
}
