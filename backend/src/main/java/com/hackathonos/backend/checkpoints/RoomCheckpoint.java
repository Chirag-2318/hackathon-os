package com.hackathonos.backend.checkpoints;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "room_checkpoints", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"room_id", "rule_key"})
})
public class RoomCheckpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(nullable = false)
    private int position = 0;

    @Column(name = "rule_key", nullable = false, length = 50)
    private String ruleKey;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String helper;

    @Column(length = 20)
    private String tag; // VIDEO, DRAFT, SUBMIT, DEMO or null

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "progress_current")
    private Integer progressCurrent;

    @Column(name = "progress_target")
    private Integer progressTarget;

    @Column(name = "passed_at")
    private Instant passedAt;

    @Column(name = "passed_by")
    private UUID passedBy;

    @Column(name = "auto_passed", nullable = false)
    private boolean autoPassed = false;

    protected RoomCheckpoint() {}

    public RoomCheckpoint(UUID roomId, int position, String ruleKey, String title, String helper,
                          String tag, Instant dueAt, Integer progressCurrent, Integer progressTarget) {
        this.roomId = roomId;
        this.position = position;
        this.ruleKey = ruleKey;
        this.title = title;
        this.helper = helper;
        this.tag = tag;
        this.dueAt = dueAt;
        this.progressCurrent = progressCurrent;
        this.progressTarget = progressTarget;
        this.autoPassed = false;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public String getRuleKey() { return ruleKey; }
    public void setRuleKey(String ruleKey) { this.ruleKey = ruleKey; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getHelper() { return helper; }
    public void setHelper(String helper) { this.helper = helper; }

    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }

    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }

    public Integer getProgressCurrent() { return progressCurrent; }
    public void setProgressCurrent(Integer progressCurrent) { this.progressCurrent = progressCurrent; }

    public Integer getProgressTarget() { return progressTarget; }
    public void setProgressTarget(Integer progressTarget) { this.progressTarget = progressTarget; }

    public Instant getPassedAt() { return passedAt; }
    public void setPassedAt(Instant passedAt) { this.passedAt = passedAt; }

    public UUID getPassedBy() { return passedBy; }
    public void setPassedBy(UUID passedBy) { this.passedBy = passedBy; }

    public boolean isAutoPassed() { return autoPassed; }
    public void setAutoPassed(boolean autoPassed) { this.autoPassed = autoPassed; }
}
