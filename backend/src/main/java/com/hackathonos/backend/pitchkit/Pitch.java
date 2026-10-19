package com.hackathonos.backend.pitchkit;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pitches")
public class Pitch {

    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "version", nullable = false)
    private int version = 1;

    @Column(name = "beats", nullable = false, columnDefinition = "jsonb")
    private String beats = "[]";

    @Column(name = "time_limit_sec", nullable = false)
    private int timeLimitSec = 180;

    @Column(name = "source", nullable = false, length = 20)
    private String source = "DOC"; // DOC | CUSTOM

    @Column(name = "doc_version")
    private Integer docVersion;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Pitch() {}

    public Pitch(UUID roomId, int version, String beats, int timeLimitSec, String source, Integer docVersion, UUID updatedBy) {
        this.roomId = roomId;
        this.version = version;
        this.beats = beats;
        this.timeLimitSec = timeLimitSec;
        this.source = source;
        this.docVersion = docVersion;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }

    public String getBeats() { return beats; }
    public void setBeats(String beats) { this.beats = beats; }

    public int getTimeLimitSec() { return timeLimitSec; }
    public void setTimeLimitSec(int timeLimitSec) { this.timeLimitSec = timeLimitSec; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Integer getDocVersion() { return docVersion; }
    public void setDocVersion(Integer docVersion) { this.docVersion = docVersion; }

    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
