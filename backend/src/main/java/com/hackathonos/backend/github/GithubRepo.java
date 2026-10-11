package com.hackathonos.backend.github;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "github_repos")
public class GithubRepo {

    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "url", nullable = false)
    private String url;

    @Column(name = "visibility", nullable = false, length = 20)
    private String visibility; // 'public', 'private'

    @Column(name = "default_branch", nullable = false, length = 100)
    private String defaultBranch;

    @Column(name = "access", nullable = false, length = 20)
    private String access; // 'read-only'

    @Column(name = "connected_by")
    private UUID connectedBy;

    @Column(name = "connected_at", nullable = false)
    private Instant connectedAt;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Column(name = "sync_status", nullable = false, length = 20)
    private String syncStatus; // 'idle', 'running', 'failed'

    @Column(name = "sync_error", columnDefinition = "TEXT")
    private String syncError;

    @Column(name = "deployed_link", columnDefinition = "TEXT")
    private String deployedLink;

    @Column(name = "token_source", nullable = false, length = 20)
    private String tokenSource; // 'user', 'app', 'none'

    @Column(name = "updated_at")
    private Instant updatedAt;

    public GithubRepo() {}

    public GithubRepo(UUID roomId, String fullName, String url, String visibility, String defaultBranch,
                      String access, UUID connectedBy, Instant connectedAt, Instant lastSyncAt,
                      String syncStatus, String syncError, String deployedLink, String tokenSource) {
        this.roomId = roomId;
        this.fullName = fullName;
        this.url = url;
        this.visibility = visibility;
        this.defaultBranch = defaultBranch != null ? defaultBranch : "main";
        this.access = access != null ? access : "read-only";
        this.connectedBy = connectedBy;
        this.connectedAt = connectedAt != null ? connectedAt : Instant.now();
        this.lastSyncAt = lastSyncAt;
        this.syncStatus = syncStatus != null ? syncStatus : "idle";
        this.syncError = syncError;
        this.deployedLink = deployedLink;
        this.tokenSource = tokenSource != null ? tokenSource : "none";
        this.updatedAt = Instant.now();
    }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }

    public String getDefaultBranch() { return defaultBranch; }
    public void setDefaultBranch(String defaultBranch) { this.defaultBranch = defaultBranch; }

    public String getAccess() { return access; }
    public void setAccess(String access) { this.access = access; }

    public UUID getConnectedBy() { return connectedBy; }
    public void setConnectedBy(UUID connectedBy) { this.connectedBy = connectedBy; }

    public Instant getConnectedAt() { return connectedAt; }
    public void setConnectedAt(Instant connectedAt) { this.connectedAt = connectedAt; }

    public Instant getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(Instant lastSyncAt) { this.lastSyncAt = lastSyncAt; }

    public String getSyncStatus() { return syncStatus; }
    public void setSyncStatus(String syncStatus) { this.syncStatus = syncStatus; }

    public String getSyncError() { return syncError; }
    public void setSyncError(String syncError) { this.syncError = syncError; }

    public String getDeployedLink() { return deployedLink; }
    public void setDeployedLink(String deployedLink) { this.deployedLink = deployedLink; }

    public String getTokenSource() { return tokenSource; }
    public void setTokenSource(String tokenSource) { this.tokenSource = tokenSource; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
