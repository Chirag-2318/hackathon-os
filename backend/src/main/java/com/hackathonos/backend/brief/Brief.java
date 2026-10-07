package com.hackathonos.backend.brief;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "briefs")
public class Brief {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false, unique = true)
    private Long roomId;

    @Column(name = "problem_statement", columnDefinition = "TEXT")
    private String problemStatement;

    @Column(name = "raw_event_text", columnDefinition = "TEXT")
    private String rawEventText;

    @Column(name = "format_profile")
    private String formatProfile;

    @Column(name = "ai_use_policy")
    private String aiUsePolicy;

    @Column(name = "starts_at")
    private OffsetDateTime startsAt;

    @Column(name = "ends_at")
    private OffsetDateTime endsAt;

    @Column(nullable = false)
    private String timezone = "UTC";

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Brief() {}

    public Brief(Long roomId) {
        this.roomId = roomId;
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    public void touch() { this.updatedAt = OffsetDateTime.now(); }

    public Long getId() { return id; }
    public Long getRoomId() { return roomId; }
    public String getProblemStatement() { return problemStatement; }
    public String getRawEventText() { return rawEventText; }
    public String getFormatProfile() { return formatProfile; }
    public String getAiUsePolicy() { return aiUsePolicy; }
    public OffsetDateTime getStartsAt() { return startsAt; }
    public OffsetDateTime getEndsAt() { return endsAt; }
    public String getTimezone() { return timezone; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public void setProblemStatement(String v) { this.problemStatement = v; }
    public void setRawEventText(String v) { this.rawEventText = v; }
    public void setFormatProfile(String v) { this.formatProfile = v; }
    public void setAiUsePolicy(String v) { this.aiUsePolicy = v; }
    public void setStartsAt(OffsetDateTime v) { this.startsAt = v; }
    public void setEndsAt(OffsetDateTime v) { this.endsAt = v; }
    public void setTimezone(String v) { this.timezone = v; }
}
