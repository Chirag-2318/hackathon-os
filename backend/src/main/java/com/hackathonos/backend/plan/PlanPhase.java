package com.hackathonos.backend.plan;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "plan_phases")
public class PlanPhase {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "plan_key", nullable = false, length = 50)
    private String planKey;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false, columnDefinition = "text")
    private String name;

    @Column(name = "start_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal startPct;

    @Column(name = "end_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal endPct;

    @Column(name = "exit_checkpoint", columnDefinition = "TEXT")
    private String exitCheckpoint;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String goals;

    @Column(name = "start_hour", precision = 6, scale = 2)
    private BigDecimal startHour;

    @Column(name = "end_hour", precision = 6, scale = 2)
    private BigDecimal endHour;

    @Column(columnDefinition = "TEXT")
    private String goal;

    @Column(columnDefinition = "TEXT")
    private String owners;

    @Column(columnDefinition = "TEXT")
    private String deliverables;

    @Column(name = "raw_markdown", columnDefinition = "TEXT")
    private String rawMarkdown;

    @Column(nullable = false, length = 20)
    private String status = "NOT_STARTED"; // NOT_STARTED, ACTIVE, COMPLETED

    @Column(name = "activated_at")
    private Instant activatedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "tasks_generated_at")
    private Instant tasksGeneratedAt;

    @Column(name = "ready_notified_at")
    private Instant readyNotifiedAt;

    @Column(name = "ready_dismissed_at")
    private Instant readyDismissedAt;

    protected PlanPhase() {}

    public PlanPhase(UUID roomId, String planKey, int position, String name, BigDecimal startPct, BigDecimal endPct, String exitCheckpoint, String goals) {
        this.roomId = roomId;
        this.planKey = planKey;
        this.position = position;
        this.name = name;
        this.startPct = startPct;
        this.endPct = endPct;
        this.exitCheckpoint = exitCheckpoint;
        this.goals = goals;
        this.status = "NOT_STARTED";
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getPlanKey() { return planKey; }
    public void setPlanKey(String planKey) { this.planKey = planKey; }

    public String getPhaseKey() { return planKey; }
    public void setPhaseKey(String phaseKey) { this.planKey = phaseKey; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getStartPct() { return startPct; }
    public void setStartPct(BigDecimal startPct) { this.startPct = startPct; }

    public BigDecimal getEndPct() { return endPct; }
    public void setEndPct(BigDecimal endPct) { this.endPct = endPct; }

    public String getExitCheckpoint() { return exitCheckpoint; }
    public void setExitCheckpoint(String exitCheckpoint) { this.exitCheckpoint = exitCheckpoint; }

    public String getGoals() { return goals; }
    public void setGoals(String goals) { this.goals = goals; }

    public BigDecimal getStartHour() { return startHour; }
    public void setStartHour(BigDecimal startHour) { this.startHour = startHour; }

    public BigDecimal getEndHour() { return endHour; }
    public void setEndHour(BigDecimal endHour) { this.endHour = endHour; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public String getOwners() { return owners; }
    public void setOwners(String owners) { this.owners = owners; }

    public String getDeliverables() { return deliverables; }
    public void setDeliverables(String deliverables) { this.deliverables = deliverables; }

    public String getRawMarkdown() { return rawMarkdown; }
    public void setRawMarkdown(String rawMarkdown) { this.rawMarkdown = rawMarkdown; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getActivatedAt() { return activatedAt; }
    public void setActivatedAt(Instant activatedAt) { this.activatedAt = activatedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Instant getTasksGeneratedAt() { return tasksGeneratedAt; }
    public void setTasksGeneratedAt(Instant tasksGeneratedAt) { this.tasksGeneratedAt = tasksGeneratedAt; }

    public Instant getReadyNotifiedAt() { return readyNotifiedAt; }
    public void setReadyNotifiedAt(Instant readyNotifiedAt) { this.readyNotifiedAt = readyNotifiedAt; }

    public Instant getReadyDismissedAt() { return readyDismissedAt; }
    public void setReadyDismissedAt(Instant readyDismissedAt) { this.readyDismissedAt = readyDismissedAt; }
}
