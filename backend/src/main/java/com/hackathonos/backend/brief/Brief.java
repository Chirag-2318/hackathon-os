package com.hackathonos.backend.brief;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "briefs")
public class Brief {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false, unique = true)
    private UUID roomId;

    @Column(nullable = false, length = 20)
    private String source;

    @Column(name = "source_url", columnDefinition = "TEXT")
    private String sourceUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "problem_statement", columnDefinition = "TEXT")
    private String problemStatement;

    @Column(name = "target_audience", columnDefinition = "TEXT")
    private String targetAudience;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String deadlines;

    @Column(columnDefinition = "TEXT")
    private String eligibility;

    @Column(name = "tech_rules", columnDefinition = "TEXT")
    private String techRules;

    @Column(name = "ai_policy", columnDefinition = "TEXT")
    private String aiPolicy;

    @Column(name = "judging_format", columnDefinition = "TEXT")
    private String judgingFormat;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String deliverables;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tracks_and_prizes", columnDefinition = "jsonb")
    private String tracksAndPrizes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String risks;

    @Column(nullable = false)
    private boolean confirmed;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "confirmed_fields", columnDefinition = "jsonb")
    private String confirmedFields;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "confirmed_by")
    private UUID confirmedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Version
    @Column(nullable = false)
    private long version = 0L;

    @Column(name = "last_edited_by")
    private UUID lastEditedBy;

    protected Brief() {}


    public Brief(UUID roomId, String source) {
        this.roomId = roomId;
        this.source = source;
        this.confirmed = false;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getRawText() { return rawText; }
    public void setRawText(String rawText) { this.rawText = rawText; }

    public String getProblemStatement() { return problemStatement; }
    public void setProblemStatement(String problemStatement) { this.problemStatement = problemStatement; }

    public String getTargetAudience() { return targetAudience; }
    public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }

    public String getDeadlines() { return deadlines; }
    public void setDeadlines(String deadlines) { this.deadlines = deadlines; }

    public String getEligibility() { return eligibility; }
    public void setEligibility(String eligibility) { this.eligibility = eligibility; }

    public String getTechRules() { return techRules; }
    public void setTechRules(String techRules) { this.techRules = techRules; }

    public String getAiPolicy() { return aiPolicy; }
    public void setAiPolicy(String aiPolicy) { this.aiPolicy = aiPolicy; }

    public String getJudgingFormat() { return judgingFormat; }
    public void setJudgingFormat(String judgingFormat) { this.judgingFormat = judgingFormat; }

    public String getDeliverables() { return deliverables; }
    public void setDeliverables(String deliverables) { this.deliverables = deliverables; }

    public String getTracksAndPrizes() { return tracksAndPrizes; }
    public void setTracksAndPrizes(String tracksAndPrizes) { this.tracksAndPrizes = tracksAndPrizes; }

    public String getRisks() { return risks; }
    public void setRisks(String risks) { this.risks = risks; }

    public boolean isConfirmed() { return confirmed; }
    public void setConfirmed(boolean confirmed) { this.confirmed = confirmed; }

    public String getConfirmedFields() { return confirmedFields; }
    public void setConfirmedFields(String confirmedFields) { this.confirmedFields = confirmedFields; }

    public Instant getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(Instant confirmedAt) { this.confirmedAt = confirmedAt; }

    public UUID getConfirmedBy() { return confirmedBy; }
    public void setConfirmedBy(UUID confirmedBy) { this.confirmedBy = confirmedBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public long getVersion() { return version; }
    public void setVersion(long version) { this.version = version; }

    public UUID getLastEditedBy() { return lastEditedBy; }
    public void setLastEditedBy(UUID lastEditedBy) { this.lastEditedBy = lastEditedBy; }
}

