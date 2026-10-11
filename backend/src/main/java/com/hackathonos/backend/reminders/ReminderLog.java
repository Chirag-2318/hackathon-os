package com.hackathonos.backend.reminders;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reminder_log", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"kind", "ref_id", "user_id"})
})
public class ReminderLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 30)
    private String kind; // TASK_DUE, CHECKPOINT_DUE

    @Column(name = "ref_id", nullable = false)
    private UUID refId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt = Instant.now();

    protected ReminderLog() {}

    public ReminderLog(String kind, UUID refId, UUID userId) {
        this.kind = kind;
        this.refId = refId;
        this.userId = userId;
        this.sentAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public UUID getRefId() { return refId; }
    public void setRefId(UUID refId) { this.refId = refId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
}
