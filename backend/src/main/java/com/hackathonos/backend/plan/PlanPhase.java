package com.hackathonos.backend.plan;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
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

    @Column(nullable = false, length = 100)
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
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getPlanKey() { return planKey; }
    public void setPlanKey(String planKey) { this.planKey = planKey; }

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
}
