package com.hackathonos.backend.pitchkit;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rehearsals")
public class Rehearsal {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "pitch_version", nullable = false)
    private int pitchVersion = 1;

    @Column(name = "mode", nullable = false, length = 20)
    private String mode = "TIMED"; // TIMED | VOICE

    @Column(name = "scope", nullable = false, length = 20)
    private String scope = "FULL"; // FULL | MY_BEATS | ONE_BEAT

    @Column(name = "started_at", nullable = false)
    private Instant startedAt = Instant.now();

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "duration_ms", nullable = false)
    private long durationMs = 0L;

    @Column(name = "planned_ms", nullable = false)
    private long plannedMs = 0L;

    @Column(name = "completed", nullable = false)
    private boolean completed = false;

    @Column(name = "completion_pct", nullable = false)
    private int completionPct = 0;

    @Column(name = "beat_timings", nullable = false, columnDefinition = "jsonb")
    private String beatTimings = "[]";

    @Column(name = "stumbles", nullable = false, columnDefinition = "jsonb")
    private String stumbles = "[]";

    @Column(name = "transcript", nullable = false, columnDefinition = "jsonb")
    private String transcript = "{}";

    @Column(name = "metrics", nullable = false, columnDefinition = "jsonb")
    private String metrics = "{}";

    @Column(name = "coach", columnDefinition = "jsonb")
    private String coach;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Rehearsal() {}

    public Rehearsal(UUID roomId, UUID userId, int pitchVersion, String mode, String scope, long plannedMs) {
        this.id = UUID.randomUUID();
        this.roomId = roomId;
        this.userId = userId;
        this.pitchVersion = pitchVersion;
        this.mode = mode;
        this.scope = scope;
        this.plannedMs = plannedMs;
        this.startedAt = Instant.now();
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public int getPitchVersion() { return pitchVersion; }
    public void setPitchVersion(int pitchVersion) { this.pitchVersion = pitchVersion; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getEndedAt() { return endedAt; }
    public void setEndedAt(Instant endedAt) { this.endedAt = endedAt; }

    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }

    public long getPlannedMs() { return plannedMs; }
    public void setPlannedMs(long plannedMs) { this.plannedMs = plannedMs; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public int getCompletionPct() { return completionPct; }
    public void setCompletionPct(int completionPct) { this.completionPct = completionPct; }

    public String getBeatTimings() { return beatTimings; }
    public void setBeatTimings(String beatTimings) { this.beatTimings = beatTimings; }

    public String getStumbles() { return stumbles; }
    public void setStumbles(String stumbles) { this.stumbles = stumbles; }

    public String getTranscript() { return transcript; }
    public void setTranscript(String transcript) { this.transcript = transcript; }

    public String getMetrics() { return metrics; }
    public void setMetrics(String metrics) { this.metrics = metrics; }

    public String getCoach() { return coach; }
    public void setCoach(String coach) { this.coach = coach; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
