package com.hackathonos.backend.rooms;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "project_description", columnDefinition = "text")
    private String projectDescription;

    @Column(name = "template_id", length = 50)
    private String templateId;

    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "freeze_at")
    private Instant freezeAt;

    @Column(name = "ends_at")
    private Instant endsAt;

    @Column(name = "duration_hours", nullable = false)
    private int durationHours = 36;

    @Column(name = "deadline_overridden", nullable = false)
    private boolean deadlineOverridden = false;

    @Column(name = "workflow_stage", nullable = false, length = 30)
    private String workflowStage = "PLANNING";

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "event_start")
    private Instant eventStart;

    @Column(name = "event_end")
    private Instant eventEnd;

    @Column(length = 100)
    private String timezone;

    @Column(nullable = false, length = 20)
    private String stage = "brief";

    @Column(name = "brief_done", nullable = false)
    private boolean briefDone = false;

    @Column(name = "ideate_done", nullable = false)
    private boolean ideateDone = false;

    @Column(name = "plan_done", nullable = false)
    private boolean planDone = false;

    @Column(name = "plan_started_at")
    private Instant planStartedAt;

    @Column(name = "plan_notes", columnDefinition = "TEXT")
    private String planNotes;

    @Column(name = "build_started_at")
    private Instant buildStartedAt;

    @Column(name = "key_prefix", length = 6)
    private String keyPrefix;

    @Column(name = "task_counter", nullable = false)
    private int taskCounter = 0;

    @Column(name = "join_code", nullable = false, unique = true, length = 16)
    private String joinCode;

    @Column(name = "code_revoked", nullable = false)
    private boolean codeRevoked = false;

    @Column(name = "code_expires_at")
    private Instant codeExpiresAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Room() {}

    public Room(String name, String description, String projectDescription, String templateId,
                UUID ownerId, Instant startsAt, Instant endsAt, String timezone,
                String keyPrefix, String joinCode) {
        this.name = name;
        this.description = description;
        this.projectDescription = projectDescription;
        this.templateId = templateId;
        this.ownerId = ownerId;
        this.startsAt = startsAt;
        this.eventStart = startsAt;
        this.endsAt = endsAt;
        this.eventEnd = endsAt;
        this.timezone = timezone;
        this.stage = "brief";
        this.workflowStage = "PLANNING";
        this.briefDone = false;
        this.ideateDone = false;
        this.planDone = false;
        this.keyPrefix = keyPrefix;
        this.taskCounter = 0;
        this.joinCode = joinCode;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getProjectDescription() { return projectDescription; }
    public void setProjectDescription(String projectDescription) { this.projectDescription = projectDescription; }

    public String getTemplateId() { return templateId; }
    public void setTemplateId(String templateId) { this.templateId = templateId; }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public Instant getStartsAt() { return startsAt != null ? startsAt : eventStart; }
    public void setStartsAt(Instant startsAt) {
        this.startsAt = startsAt;
        this.eventStart = startsAt;
    }

    public Instant getFreezeAt() { return freezeAt; }
    public void setFreezeAt(Instant freezeAt) { this.freezeAt = freezeAt; }

    public Instant getEndsAt() { return endsAt != null ? endsAt : eventEnd; }
    public void setEndsAt(Instant endsAt) {
        this.endsAt = endsAt;
        this.eventEnd = endsAt;
    }

    public int getDurationHours() { return durationHours; }
    public void setDurationHours(int durationHours) { this.durationHours = durationHours; }

    public boolean isDeadlineOverridden() { return deadlineOverridden; }
    public void setDeadlineOverridden(boolean deadlineOverridden) { this.deadlineOverridden = deadlineOverridden; }

    public String getWorkflowStage() { return workflowStage != null ? workflowStage : "PLANNING"; }
    public void setWorkflowStage(String workflowStage) { this.workflowStage = workflowStage; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }

    public Instant getEventStart() { return getStartsAt(); }
    public void setEventStart(Instant eventStart) { setStartsAt(eventStart); }

    public Instant getEventEnd() { return getEndsAt(); }
    public void setEventEnd(Instant eventEnd) { setEndsAt(eventEnd); }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }

    public boolean isBriefDone() { return briefDone; }
    public void setBriefDone(boolean briefDone) { this.briefDone = briefDone; }

    public boolean isIdeateDone() { return ideateDone; }
    public void setIdeateDone(boolean ideateDone) { this.ideateDone = ideateDone; }

    public boolean isPlanDone() { return planDone; }
    public void setPlanDone(boolean planDone) { this.planDone = planDone; }

    public Instant getPlanStartedAt() { return planStartedAt; }
    public void setPlanStartedAt(Instant planStartedAt) { this.planStartedAt = planStartedAt; }

    public String getPlanNotes() { return planNotes; }
    public void setPlanNotes(String planNotes) { this.planNotes = planNotes; }

    public Instant getBuildStartedAt() { return buildStartedAt; }
    public void setBuildStartedAt(Instant buildStartedAt) { this.buildStartedAt = buildStartedAt; }

    public String getKeyPrefix() { return keyPrefix; }
    public void setKeyPrefix(String keyPrefix) { this.keyPrefix = keyPrefix; }

    public int getTaskCounter() { return taskCounter; }
    public void setTaskCounter(int taskCounter) { this.taskCounter = taskCounter; }

    public String getJoinCode() { return joinCode; }
    public void setJoinCode(String joinCode) { this.joinCode = joinCode; }

    public boolean isCodeRevoked() { return codeRevoked; }
    public void setCodeRevoked(boolean codeRevoked) { this.codeRevoked = codeRevoked; }

    public Instant getCodeExpiresAt() { return codeExpiresAt; }
    public void setCodeExpiresAt(Instant codeExpiresAt) { this.codeExpiresAt = codeExpiresAt; }

    public Instant getArchivedAt() { return archivedAt; }
    public void setArchivedAt(Instant archivedAt) { this.archivedAt = archivedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
