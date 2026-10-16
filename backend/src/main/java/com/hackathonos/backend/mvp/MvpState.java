package com.hackathonos.backend.mvp;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mvp_state")
public class MvpState {

    @Id
    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(columnDefinition = "text")
    private String identity;

    @Column(columnDefinition = "TEXT")
    private String wow;

    @Column(columnDefinition = "TEXT")
    private String differentiation;

    @Column(name = "breaks_first", columnDefinition = "TEXT")
    private String breaksFirst;

    @Column(name = "health_runs", nullable = false)
    private boolean healthRuns = false;

    @Column(name = "health_stable", nullable = false)
    private boolean healthStable = false;

    @Column(name = "health_clear30", nullable = false)
    private boolean healthClear30 = false;

    @Column(name = "health_wow60", nullable = false)
    private boolean healthWow60 = false;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Version
    @Column(nullable = false)
    private long version = 0L;

    @Column(name = "last_edited_by")
    private UUID lastEditedBy;

    protected MvpState() {}


    public MvpState(UUID roomId, String identity, String wow) {
        this.roomId = roomId;
        this.identity = identity;
        this.wow = wow;
        this.updatedAt = Instant.now();
    }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getIdentity() { return identity; }
    public void setIdentity(String identity) { this.identity = identity; }

    public String getWow() { return wow; }
    public void setWow(String wow) { this.wow = wow; }

    public String getDifferentiation() { return differentiation; }
    public void setDifferentiation(String differentiation) { this.differentiation = differentiation; }

    public String getBreaksFirst() { return breaksFirst; }
    public void setBreaksFirst(String breaksFirst) { this.breaksFirst = breaksFirst; }

    public boolean isHealthRuns() { return healthRuns; }
    public void setHealthRuns(boolean healthRuns) { this.healthRuns = healthRuns; }

    public boolean isHealthStable() { return healthStable; }
    public void setHealthStable(boolean healthStable) { this.healthStable = healthStable; }

    public boolean isHealthClear30() { return healthClear30; }
    public void setHealthClear30(boolean healthClear30) { this.healthClear30 = healthClear30; }

    public boolean isHealthWow60() { return healthWow60; }
    public void setHealthWow60(boolean healthWow60) { this.healthWow60 = healthWow60; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public long getVersion() { return version; }
    public void setVersion(long version) { this.version = version; }

    public UUID getLastEditedBy() { return lastEditedBy; }
    public void setLastEditedBy(UUID lastEditedBy) { this.lastEditedBy = lastEditedBy; }
}

