package com.hackathonos.backend.plan;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "plan_steps", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"room_id", "step_key"})
})
public class PlanStep {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "step_key", nullable = false, length = 20)
    private String stepKey; // prd, tech, phases, tasks, demo

    @Column(columnDefinition = "TEXT")
    private String answer;

    @Column(nullable = false)
    private boolean validated = false;

    @Column(name = "validated_with_overrides", nullable = false)
    private boolean validatedWithOverrides = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String errors;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String warnings;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String parsed;

    @Column(name = "validated_at")
    private Instant validatedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected PlanStep() {}

    public PlanStep(UUID roomId, String stepKey) {
        this.roomId = roomId;
        this.stepKey = stepKey;
        this.validated = false;
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getStepKey() { return stepKey; }
    public void setStepKey(String stepKey) { this.stepKey = stepKey; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public boolean isValidated() { return validated; }
    public void setValidated(boolean validated) { this.validated = validated; }

    public boolean isValidatedWithOverrides() { return validatedWithOverrides; }
    public void setValidatedWithOverrides(boolean validatedWithOverrides) { this.validatedWithOverrides = validatedWithOverrides; }

    public String getErrors() { return errors; }
    public void setErrors(String errors) { this.errors = errors; }

    public String getWarnings() { return warnings; }
    public void setWarnings(String warnings) { this.warnings = warnings; }

    public String getParsed() { return parsed; }
    public void setParsed(String parsed) { this.parsed = parsed; }

    public Instant getValidatedAt() { return validatedAt; }
    public void setValidatedAt(Instant validatedAt) { this.validatedAt = validatedAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
