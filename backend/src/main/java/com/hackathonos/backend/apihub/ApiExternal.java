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
    private String authType; // 'NONE', 'API_KEY', 'BEARER', 'OAUTH'

    @Column(name = "rate_limit", length = 100)
    private String rateLimit;

    @Column(name = "cost", length = 100)
    private String cost;

    @Column(name = "key_owner_id")
    private UUID keyOwnerId;

    @Column(name = "key_location", columnDefinition = "TEXT")
    private String keyLocation;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // 'UNKNOWN', 'WORKING', 'FAILING'

    @Column(name = "fallback", columnDefinition = "TEXT")
    private String fallback;

    @Column(name = "last_checked_at")
    private Instant lastCheckedAt;

    @Column(name = "last_latency_ms")
    private Integer lastLatencyMs;

    public ApiExternal() {}

    public ApiExternal(UUID roomId, String name, String baseUrl, String authType,
                       String rateLimit, String cost, UUID keyOwnerId, String keyLocation,
                       String status, String fallback, Instant lastCheckedAt, Integer lastLatencyMs) {
        this.roomId = roomId;
        this.name = name;
        this.baseUrl = baseUrl;
        this.authType = authType != null ? authType : "NONE";
        this.rateLimit = rateLimit;
        this.cost = cost;
        this.keyOwnerId = keyOwnerId;
        this.keyLocation = keyLocation;
        this.status = status != null ? status : "UNKNOWN";
        this.fallback = fallback;
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

    public String getRateLimit() { return rateLimit; }
    public void setRateLimit(String rateLimit) { this.rateLimit = rateLimit; }

    public String getCost() { return cost; }
    public void setCost(String cost) { this.cost = cost; }

    public UUID getKeyOwnerId() { return keyOwnerId; }
    public void setKeyOwnerId(UUID keyOwnerId) { this.keyOwnerId = keyOwnerId; }

    public String getKeyLocation() { return keyLocation; }
    public void setKeyLocation(String keyLocation) { this.keyLocation = keyLocation; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFallback() { return fallback; }
    public void setFallback(String fallback) { this.fallback = fallback; }

    public Instant getLastCheckedAt() { return lastCheckedAt; }
    public void setLastCheckedAt(Instant lastCheckedAt) { this.lastCheckedAt = lastCheckedAt; }

    public Integer getLastLatencyMs() { return lastLatencyMs; }
    public void setLastLatencyMs(Integer lastLatencyMs) { this.lastLatencyMs = lastLatencyMs; }
}
