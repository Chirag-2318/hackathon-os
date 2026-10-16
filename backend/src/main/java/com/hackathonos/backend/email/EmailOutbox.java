package com.hackathonos.backend.email;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "email_outbox")
public class EmailOutbox {

    public enum Status {
        PENDING,
        SENT,
        FAILED,
        SKIPPED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "to_email", nullable = false)
    private String toEmail;

    @Column(nullable = false, length = 50)
    private String template;

    @Column(nullable = false)
    private String subject;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", columnDefinition = "jsonb", nullable = false)
    private String payload = "{}";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(nullable = false)
    private int attempts = 0;

    @Column(name = "next_attempt_at", nullable = false)
    private Instant nextAttemptAt = Instant.now();

    @Column(name = "last_error", length = 300)
    private String lastError;

    @Column(name = "dedupe_key", unique = true)
    private String dedupeKey;

    @Column(name = "priority", nullable = false)
    private int priority = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "sent_at")
    private Instant sentAt;

    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }

    protected EmailOutbox() {}

    public EmailOutbox(String toEmail, String template, String subject, String payload, String dedupeKey) {
        this(toEmail, template, subject, payload, dedupeKey, 0);
    }

    public EmailOutbox(String toEmail, String template, String subject, String payload, String dedupeKey, int priority) {
        this.toEmail = toEmail;
        this.template = template;
        this.subject = subject;
        this.payload = (payload != null && !payload.isBlank()) ? payload : "{}";
        this.dedupeKey = dedupeKey;
        this.priority = priority;
        this.status = Status.PENDING;
        this.attempts = 0;
        this.nextAttemptAt = Instant.now();
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getToEmail() { return toEmail; }
    public void setToEmail(String toEmail) { this.toEmail = toEmail; }

    public String getTemplate() { return template; }
    public void setTemplate(String template) { this.template = template; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public Instant getNextAttemptAt() { return nextAttemptAt; }
    public void setNextAttemptAt(Instant nextAttemptAt) { this.nextAttemptAt = nextAttemptAt; }

    public String getLastError() { return lastError; }
    public void setLastError(String lastError) { this.lastError = lastError; }

    public String getDedupeKey() { return dedupeKey; }
    public void setDedupeKey(String dedupeKey) { this.dedupeKey = dedupeKey; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
}
