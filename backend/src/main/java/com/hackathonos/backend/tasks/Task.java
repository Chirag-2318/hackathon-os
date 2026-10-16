package com.hackathonos.backend.tasks;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Locale;
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

    @Column(nullable = false, columnDefinition = "text")
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

    @Column(name = "phase_key", length = 20)
    private String phaseKey;

    @Column(name = "local_id", length = 20)
    private String localId;

    @Column(name = "deferred_from", length = 20)
    private String deferredFrom;

    @Column(name = "drop_reason", columnDefinition = "TEXT")
    private String dropReason;

    public boolean isConfirmedDone() {
        return "DONE".equalsIgnoreCase(status) && "CONFIRMED".equalsIgnoreCase(reviewState);
    }

    public boolean isDropped() {
        return "DROPPED".equalsIgnoreCase(status);
    }

    public boolean isSatisfiedForDependency() {
        return isConfirmedDone() || isDropped();
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
        this.status = normalizeStatus(status);
        this.assigneeId = assigneeId;
        this.reporterId = reporterId;
        this.priority = normalizePriority(priority);
        this.phaseId = phaseId;
        this.roleLabel = roleLabel;
        this.estimateMin = estimateMin > 0 ? estimateMin : 60;
        this.dueAt = dueAt;
        this.position = position;
        this.source = normalizeSource(source);
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Task(UUID roomId, String taskKey, String summary, String description,
                String status, int position, UUID assigneeId, UUID reporterId,
                String phaseKey, String type, String role) {
        this.roomId = roomId;
        this.taskKey = taskKey;
        this.summary = summary;
        this.description = description;
        this.status = normalizeStatus(status);
        this.position = position;
        this.assigneeId = assigneeId;
        this.reporterId = reporterId;
        this.phaseKey = phaseKey;
        this.source = normalizeSource(type);
        this.roleLabel = role;
        int parsedNum = 1;
        try {
            if (taskKey != null && taskKey.contains("-")) {
                parsedNum = Integer.parseInt(taskKey.substring(taskKey.lastIndexOf("-") + 1));
            } else {
                parsedNum = position + 1;
            }
        } catch (Exception ignored) {
            parsedNum = position + 1;
        }
        this.number = parsedNum;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public static String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "TODO";
        String s = status.trim().toUpperCase(Locale.ROOT);
        return switch (s) {
            case "TODO", "IN_PROGRESS", "DONE", "DROPPED" -> s;
            case "IN PROGRESS", "DOING" -> "IN_PROGRESS";
            case "FINISHED", "COMPLETE", "COMPLETED" -> "DONE";
            default -> "TODO";
        };
    }

    public static String normalizePriority(String priority) {
        if (priority == null || priority.isBlank()) return "MEDIUM";
        String s = priority.trim().toUpperCase(Locale.ROOT);
        if (s.contains("P0") || s.contains("HIGHEST") || s.contains("CRITICAL") || s.contains("URGENT") || s.contains("BLOCKER")) {
            return "HIGHEST";
        }
        if (s.contains("P1") || s.contains("HIGH")) {
            return "HIGH";
        }
        if (s.contains("P3") || s.contains("LOWEST")) {
            return "LOWEST";
        }
        if (s.contains("LOW")) {
            return "LOW";
        }
        if (s.contains("P2") || s.contains("MEDIUM") || s.contains("NORMAL")) {
            return "MEDIUM";
        }
        return "MEDIUM";
    }

    public static String normalizeSource(String source) {
        if (source == null || source.isBlank()) return "PLAN";
        String s = source.trim().toUpperCase(Locale.ROOT);
        if ("PHASE_IMPORT".equals(s) || "MANUAL".equals(s) || "PLAN".equals(s)) {
            return s;
        }
        return "PLAN";
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
    public void setStatus(String status) { this.status = normalizeStatus(status); }

    public boolean isFlagged() { return flagged; }
    public void setFlagged(boolean flagged) { this.flagged = flagged; }

    public String getBlockedReason() { return blockedReason; }
    public void setBlockedReason(String blockedReason) { this.blockedReason = blockedReason; }

    public UUID getAssigneeId() { return assigneeId; }
    public void setAssigneeId(UUID assigneeId) { this.assigneeId = assigneeId; }

    public UUID getReporterId() { return reporterId; }
    public void setReporterId(UUID reporterId) { this.reporterId = reporterId; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = normalizePriority(priority); }

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
    public void setSource(String source) { this.source = normalizeSource(source); }

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

    public String getPhaseKey() { return phaseKey; }
    public void setPhaseKey(String phaseKey) { this.phaseKey = phaseKey; }

    public String getLocalId() { return localId; }
    public void setLocalId(String localId) { this.localId = localId; }

    public String getDeferredFrom() { return deferredFrom; }
    public void setDeferredFrom(String deferredFrom) { this.deferredFrom = deferredFrom; }

    public String getDropReason() { return dropReason; }
    public void setDropReason(String dropReason) { this.dropReason = dropReason; }

    public boolean isConfirmed() {
        return confirmedAt != null;
    }

    public Double getSpentHours() {
        return 0.0;
    }

    public void setSpentHours(Double spentHours) {
        // no-op
    }

    public String getTitle() {
        return summary;
    }

    public void setTitle(String title) {
        this.summary = title;
    }

    public Double getEstimateHours() {
        return estimateMin > 0 ? (estimateMin / 60.0) : 0.0;
    }

    public void setEstimateHours(double hours) {
        this.estimateMin = (int) Math.round(hours * 60.0);
    }

    public String getRequirement() {
        return roleLabel;
    }

    public void setRequirement(String requirement) {
        this.roleLabel = requirement;
    }
}

