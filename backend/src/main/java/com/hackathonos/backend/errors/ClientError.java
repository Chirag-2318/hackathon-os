package com.hackathonos.backend.errors;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "client_errors")
public class ClientError {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "route", length = 255)
    private String route;

    @Column(name = "message", nullable = false, length = 500)
    private String message;

    @Column(name = "stack", columnDefinition = "TEXT")
    private String stack;

    @Column(name = "build_id", length = 100)
    private String buildId;

    @Column(name = "user_agent", length = 300)
    private String userAgent;

    @Column(name = "count", nullable = false)
    private int count = 1;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt = Instant.now();

    protected ClientError() {}

    public ClientError(UUID userId, String route, String message, String stack, String buildId, String userAgent) {
        this.userId = userId;
        this.route = route;
        this.message = message;
        this.stack = stack;
        this.buildId = buildId;
        this.userAgent = userAgent;
        this.count = 1;
        this.createdAt = Instant.now();
        this.lastSeenAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getStack() { return stack; }
    public void setStack(String stack) { this.stack = stack; }

    public String getBuildId() { return buildId; }
    public void setBuildId(String buildId) { this.buildId = buildId; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(Instant lastSeenAt) { this.lastSeenAt = lastSeenAt; }
}
