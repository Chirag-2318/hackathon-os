package com.hackathonos.backend.tasks;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tasks", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"room_id", "task_key"})
})
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "task_key", nullable = false, length = 30)
    private String taskKey;

    @Column(nullable = false)
    private int number;

    @Column(nullable = false, length = 255)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String status = "TODO"; // TODO, IN_PROGRESS, DONE

    @Column(nullable = false)
    private boolean flagged = false;

    @Column(name = "blocked_reason", columnDefinition = "TEXT")
    private String blockedReason;

    @Column(name = "assignee_id")
    private UUID assigneeId;

    @Column(name = "reporter_id")
    private UUID reporterId;

    @Column(nullable = false, length = 20)
    private String priority = "MEDIUM"; // HIGHEST, HIGH, MEDIUM, LOW, LOWEST

    @Column(name = "phase_id")
    private UUID phaseId;

    @Column(name = "role_label", length = 50)
    private String roleLabel;

    @Column(name = "estimate_min", nullable = false)
    private int estimateMin = 60;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(nullable = false)
    private int position = 0;

    @Column(nullable = false, length = 20)
    private String source = "PLAN"; // PLAN, MANUAL

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "confirmed_by")
    private UUID confirmedBy;

    @Column(name = "review_state", nullable = false, length = 30)
    private String reviewState = "NONE";

    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    @Version
    @Column(nullable = false)
    private long version = 0L;

    @Column(name = "last_edited_by")
    private UUID lastEditedBy;

    public boolean isConfirmedDone() {
        return "DONE".equalsIgnoreCase(status) && "CONFIRMED".equalsIgnoreCase(reviewState);
    }

    protected Task() {}


    public Task(UUID roomId, String taskKey, int number, String summary, String description,
                String status, UUID assigneeId, UUID reporterId, String priority,
                UUID phaseId, String roleLabel, int estimateMin, Instant dueAt, int position, String source) {
        this.roomId = roomId;
        this.taskKey = taskKey;
        this.number = number;
        this.summary = summary;
        this.description = description;
        this.status = status != null ? status : "TODO";
        this.assigneeId = assigneeId;
        this.reporterId = reporterId;
        this.priority = priority != null ? priority : "MEDIUM";
        this.phaseId = phaseId;
        this.roleLabel = roleLabel;
        this.estimateMin = estimateMin > 0 ? estimateMin : 60;
        this.dueAt = dueAt;
        this.position = position;
        this.source = source != null ? source : "PLAN";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getTaskKey() { return taskKey; }
    public void setTaskKey(String taskKey) { this.taskKey = taskKey; }

    public int getNumber() { return number; }
    public void setNumber(int number) { this.number = number; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isFlagged() { return flagged; }
    public void setFlagged(boolean flagged) { this.flagged = flagged; }

    public String getBlockedReason() { return blockedReason; }
    public void setBlockedReason(String blockedReason) { this.blockedReason = blockedReason; }

    public UUID getAssigneeId() { return assigneeId; }
    public void setAssigneeId(UUID assigneeId) { this.assigneeId = assigneeId; }

    public UUID getReporterId() { return reporterId; }
    public void setReporterId(UUID reporterId) { this.reporterId = reporterId; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public UUID getPhaseId() { return phaseId; }
    public void setPhaseId(UUID phaseId) { this.phaseId = phaseId; }

    public String getRoleLabel() { return roleLabel; }
    public void setRoleLabel(String roleLabel) { this.roleLabel = roleLabel; }

    public String getRole() { return roleLabel; }

    public int getEstimateMin() { return estimateMin; }
    public void setEstimateMin(int estimateMin) { this.estimateMin = estimateMin; }

    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public long getVersion() { return version; }
    public void setVersion(long version) { this.version = version; }

    public UUID getLastEditedBy() { return lastEditedBy; }
    public void setLastEditedBy(UUID lastEditedBy) { this.lastEditedBy = lastEditedBy; }

    public Instant getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(Instant confirmedAt) { this.confirmedAt = confirmedAt; }

    public UUID getConfirmedBy() { return confirmedBy; }
    public void setConfirmedBy(UUID confirmedBy) { this.confirmedBy = confirmedBy; }

    public String getReviewState() { return reviewState; }
    public void setReviewState(String reviewState) { this.reviewState = reviewState != null ? reviewState : "NONE"; }

    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String reviewNote) { this.reviewNote = reviewNote; }
}

