package com.hackathonos.backend.pitch;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Stores the generated pitch script for a room.
 */
@Entity
@Table(name = "pitch_scripts")
public class PitchScript {

    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "speaker_count", nullable = false)
    private int speakerCount = 1;

    @Column(name = "speakers", nullable = false, columnDefinition = "jsonb")
    private String speakers = "[]";

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "hook", columnDefinition = "TEXT")
    private String hook;

    @Column(name = "closing_line", columnDefinition = "TEXT")
    private String closingLine;

    @Column(name = "total_seconds", nullable = false)
    private int totalSeconds = 0;

    @Column(name = "slides", nullable = false, columnDefinition = "jsonb")
    private String slides = "[]";

    @Column(name = "generated_by")
    private UUID generatedBy;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt = Instant.now();

    public PitchScript() {}

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public int getSpeakerCount() { return speakerCount; }
    public void setSpeakerCount(int speakerCount) { this.speakerCount = speakerCount; }

    public String getSpeakers() { return speakers; }
    public void setSpeakers(String speakers) { this.speakers = speakers != null ? speakers : "[]"; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public String getHook() { return hook; }
    public void setHook(String hook) { this.hook = hook; }

    public String getClosingLine() { return closingLine; }
    public void setClosingLine(String closingLine) { this.closingLine = closingLine; }

    public int getTotalSeconds() { return totalSeconds; }
    public void setTotalSeconds(int totalSeconds) { this.totalSeconds = totalSeconds; }

    public String getSlides() { return slides; }
    public void setSlides(String slides) { this.slides = slides != null ? slides : "[]"; }

    public UUID getGeneratedBy() { return generatedBy; }
    public void setGeneratedBy(UUID generatedBy) { this.generatedBy = generatedBy; }

    public Instant getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
}
