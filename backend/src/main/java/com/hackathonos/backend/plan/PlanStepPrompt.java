package com.hackathonos.backend.plan;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "plan_step_prompts", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"room_id", "step_index"})
})
public class PlanStepPrompt {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "step_index", nullable = false)
    private int stepIndex;

    @Column(name = "step_key", nullable = false, length = 20)
    private String stepKey;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;

    @Column(name = "char_count", nullable = false)
    private int charCount;

    @Column(length = 50)
    private String mode;

    @Column(name = "idea_verdict", columnDefinition = "TEXT")
    private String ideaVerdict;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "missing_inputs", columnDefinition = "jsonb")
    private String missingInputs = "[]";

    @Column(nullable = false)
    private boolean stale = false;

    @Column(name = "input_hash", nullable = false, length = 64)
    private String inputHash;

    @Column(name = "assessment_locked", columnDefinition = "TEXT")
    private String assessmentLocked;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected PlanStepPrompt() {}

    public PlanStepPrompt(UUID roomId, int stepIndex, String stepKey, String prompt, int charCount,
                          String mode, String ideaVerdict, String missingInputs, boolean stale,
                          String inputHash, String assessmentLocked) {
        this.roomId = roomId;
        this.stepIndex = stepIndex;
        this.stepKey = stepKey;
        this.prompt = prompt;
        this.charCount = charCount;
        this.mode = mode;
        this.ideaVerdict = ideaVerdict;
        this.missingInputs = missingInputs != null ? missingInputs : "[]";
        this.stale = stale;
        this.inputHash = inputHash;
        this.assessmentLocked = assessmentLocked;
        this.generatedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public int getStepIndex() { return stepIndex; }
    public void setStepIndex(int stepIndex) { this.stepIndex = stepIndex; }

    public String getStepKey() { return stepKey; }
    public void setStepKey(String stepKey) { this.stepKey = stepKey; }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }

    public int getCharCount() { return charCount; }
    public void setCharCount(int charCount) { this.charCount = charCount; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public String getIdeaVerdict() { return ideaVerdict; }
    public void setIdeaVerdict(String ideaVerdict) { this.ideaVerdict = ideaVerdict; }

    public String getMissingInputs() { return missingInputs; }
    public void setMissingInputs(String missingInputs) { this.missingInputs = missingInputs; }

    public boolean isStale() { return stale; }
    public void setStale(boolean stale) { this.stale = stale; }

    public String getInputHash() { return inputHash; }
    public void setInputHash(String inputHash) { this.inputHash = inputHash; }

    public String getAssessmentLocked() { return assessmentLocked; }
    public void setAssessmentLocked(String assessmentLocked) { this.assessmentLocked = assessmentLocked; }

    public Instant getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
