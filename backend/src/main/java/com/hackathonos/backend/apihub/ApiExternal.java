package com.hackathonos.backend.apihub;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "api_externals")
public class ApiExternal {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "base_url", nullable = false, columnDefinition = "TEXT")
    private String baseUrl;

    @Column(name = "auth_type", nullable = false, length = 20)
    private String authType; // 'NONE', 'API_KEY', 'BEARER', 'OAUTH', 'BASIC'

    @Column(name = "key_location", length = 500)
    private String keyLocation;

    @Column(name = "rate_limit", columnDefinition = "TEXT")
    private String rateLimit;

    @Column(name = "cost", columnDefinition = "TEXT")
    private String cost;

    @Column(name = "owner_user_id")
    private UUID ownerUserId;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // 'WORKING', 'FAILING', 'UNKNOWN'

    @Column(name = "fallback", length = 20)
    private String fallback; // 'NONE', 'MOCKED', 'CACHED'

    @Column(name = "fallback_notes", columnDefinition = "TEXT")
    private String fallbackNotes;

    @Column(name = "docs_url", columnDefinition = "TEXT")
    private String docsUrl;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by")
    private UUID createdBy;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Column(name = "last_checked_at")
    private Instant lastCheckedAt;

    @Column(name = "last_latency_ms")
    private Integer lastLatencyMs;

    public ApiExternal() {}

    public ApiExternal(UUID roomId, String name, String baseUrl, String authType,
                       String rateLimit, String cost, UUID ownerUserId, String keyLocation,
                       String status, String fallback, String fallbackNotes, String docsUrl,
                       String notes, UUID createdBy, Instant lastCheckedAt, Integer lastLatencyMs) {
        this.roomId = roomId;
        this.name = name;
        this.baseUrl = baseUrl;
        this.authType = authType != null ? authType : "NONE";
        this.rateLimit = rateLimit;
        this.cost = cost;
        this.ownerUserId = ownerUserId;
        this.keyLocation = keyLocation;
        this.status = status != null ? status : "UNKNOWN";
        this.fallback = fallback != null ? fallback : "NONE";
        this.fallbackNotes = fallbackNotes;
        this.docsUrl = docsUrl;
        this.notes = notes;
        this.createdBy = createdBy;
        this.lastCheckedAt = lastCheckedAt;
        this.lastLatencyMs = lastLatencyMs;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public String getAuthType() { return authType; }
    public void setAuthType(String authType) { this.authType = authType; }

    public String getKeyLocation() { return keyLocation; }
    public void setKeyLocation(String keyLocation) { this.keyLocation = keyLocation; }

    public String getRateLimit() { return rateLimit; }
    public void setRateLimit(String rateLimit) { this.rateLimit = rateLimit; }

    public String getCost() { return cost; }
    public void setCost(String cost) { this.cost = cost; }

    public UUID getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(UUID ownerUserId) { this.ownerUserId = ownerUserId; }

    public UUID getKeyOwnerId() { return ownerUserId; }
    public void setKeyOwnerId(UUID keyOwnerId) { this.ownerUserId = keyOwnerId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFallback() { return fallback; }
    public void setFallback(String fallback) { this.fallback = fallback; }

    public String getFallbackNotes() { return fallbackNotes; }
    public void setFallbackNotes(String fallbackNotes) { this.fallbackNotes = fallbackNotes; }

    public String getDocsUrl() { return docsUrl; }
    public void setDocsUrl(String docsUrl) { this.docsUrl = docsUrl; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public Instant getLastCheckedAt() { return lastCheckedAt; }
    public void setLastCheckedAt(Instant lastCheckedAt) { this.lastCheckedAt = lastCheckedAt; }

    public Integer getLastLatencyMs() { return lastLatencyMs; }
    public void setLastLatencyMs(Integer lastLatencyMs) { this.lastLatencyMs = lastLatencyMs; }
}
