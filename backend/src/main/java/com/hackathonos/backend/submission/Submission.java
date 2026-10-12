package com.hackathonos.backend.submission;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "submissions")
public class Submission {

    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "status", nullable = false, length = 30)
    private String status; // 'DRAFT', 'VERIFIED', 'SUBMITTED'

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "draft", columnDefinition = "jsonb")
    private String draft; // JSON object: whatItDoes, whyItMatters, howBuilt, challenges, whatsNext

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "form_fields", columnDefinition = "jsonb")
    private String formFields; // JSON list

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "submitted_by")
    private UUID submittedBy;

    public Submission() {}

    public Submission(UUID roomId, String status, String draft, String formFields, Instant createdAt) {
        this.roomId = roomId;
        this.status = status != null ? status : "DRAFT";
        this.draft = draft != null ? draft : "{}";
        this.formFields = formFields != null ? formFields : "[]";
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDraft() { return draft; }
    public void setDraft(String draft) { this.draft = draft; }

    public String getFormFields() { return formFields; }
    public void setFormFields(String formFields) { this.formFields = formFields; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public UUID getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(UUID submittedBy) { this.submittedBy = submittedBy; }
}
