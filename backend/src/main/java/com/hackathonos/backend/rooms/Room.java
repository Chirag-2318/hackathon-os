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

    @Column(length = 200)
    private String description;

    @Column(name = "project_description", length = 500)
    private String projectDescription;

    @Column(name = "template_id", length = 50)
    private String templateId;

    @Column(name = "owner_id")
    private UUID ownerId;

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

    @Column(name = "build_started_at")
    private Instant buildStartedAt;

    @Column(name = "key_prefix", length = 6)
    private String keyPrefix;

    @Column(name = "task_counter", nullable = false)
    private int taskCounter = 0;

    @Column(name = "join_code", nullable = false, unique = true, length = 4)
    private String joinCode;

    @Column(name = "archived_at")
    private Instant archivedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Room() {}

    public Room(String name, String description, String projectDescription, String templateId,
                UUID ownerId, Instant eventStart, Instant eventEnd, String timezone,
                String keyPrefix, String joinCode) {
        this.name = name;
        this.description = description;
        this.projectDescription = projectDescription;
        this.templateId = templateId;
        this.ownerId = ownerId;
        this.eventStart = eventStart;
        this.eventEnd = eventEnd;
        this.timezone = timezone;
        this.stage = "brief";
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

    public Instant getEventStart() { return eventStart; }
    public void setEventStart(Instant eventStart) { this.eventStart = eventStart; }

    public Instant getEventEnd() { return eventEnd; }
    public void setEventEnd(Instant eventEnd) { this.eventEnd = eventEnd; }

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

    public Instant getBuildStartedAt() { return buildStartedAt; }
    public void setBuildStartedAt(Instant buildStartedAt) { this.buildStartedAt = buildStartedAt; }

    public String getKeyPrefix() { return keyPrefix; }
    public void setKeyPrefix(String keyPrefix) { this.keyPrefix = keyPrefix; }

    public int getTaskCounter() { return taskCounter; }
    public void setTaskCounter(int taskCounter) { this.taskCounter = taskCounter; }

    public String getJoinCode() { return joinCode; }
    public void setJoinCode(String joinCode) { this.joinCode = joinCode; }

    public Instant getArchivedAt() { return archivedAt; }
    public void setArchivedAt(Instant archivedAt) { this.archivedAt = archivedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
