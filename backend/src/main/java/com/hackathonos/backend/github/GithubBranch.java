package com.hackathonos.backend.github;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "github_branches", uniqueConstraints = {
        @UniqueConstraint(name = "uq_github_branches_room_name", columnNames = {"room_id", "name"})
})
public class GithubBranch {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "purpose", length = 140)
    private String purpose;

    @Column(name = "role", nullable = false, length = 20)
    private String role; // 'main', 'demo-safe', 'experiment', 'stale'

    @Column(name = "role_locked", nullable = false)
    private boolean roleLocked;

    @Column(name = "owner_user_id")
    private UUID ownerUserId;

    @Column(name = "ahead", nullable = false)
    private int ahead;

    @Column(name = "behind", nullable = false)
    private int behind;

    @Column(name = "last_commit_sha", length = 64)
    private String lastCommitSha;

    @Column(name = "last_commit_message", columnDefinition = "TEXT")
    private String lastCommitMessage;

    @Column(name = "last_commit_at")
    private Instant lastCommitAt;

    @Column(name = "pr_number")
    private Integer prNumber;

    @Column(name = "pr_title", columnDefinition = "TEXT")
    private String prTitle;

    @Column(name = "pr_status", length = 20)
    private String prStatus; // 'draft', 'open', 'merged', 'closed'

    @Column(name = "pr_conflicts", nullable = false)
    private boolean prConflicts;

    @Column(name = "pr_opened_at")
    private Instant prOpenedAt;

    @Column(name = "pr_reviewer_count", nullable = false)
    private int prReviewerCount;

    @Column(name = "url", columnDefinition = "TEXT")
    private String url;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public GithubBranch() {}

    public GithubBranch(UUID roomId, String name, String purpose, String role, boolean roleLocked,
                        UUID ownerUserId, int ahead, int behind, String lastCommitSha,
                        String lastCommitMessage, Instant lastCommitAt, Integer prNumber,
                        String prTitle, String prStatus, boolean prConflicts, Instant prOpenedAt,
                        int prReviewerCount, String url, Instant updatedAt) {
        this.roomId = roomId;
        this.name = name;
        this.purpose = purpose;
        this.role = role != null ? role : "experiment";
        this.roleLocked = roleLocked;
        this.ownerUserId = ownerUserId;
        this.ahead = ahead;
        this.behind = behind;
        this.lastCommitSha = lastCommitSha;
        this.lastCommitMessage = lastCommitMessage;
        this.lastCommitAt = lastCommitAt;
        this.prNumber = prNumber;
        this.prTitle = prTitle;
        this.prStatus = prStatus;
        this.prConflicts = prConflicts;
        this.prOpenedAt = prOpenedAt;
        this.prReviewerCount = prReviewerCount;
        this.url = url;
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isRoleLocked() { return roleLocked; }
    public void setRoleLocked(boolean roleLocked) { this.roleLocked = roleLocked; }

    public UUID getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(UUID ownerUserId) { this.ownerUserId = ownerUserId; }

    public int getAhead() { return ahead; }
    public void setAhead(int ahead) { this.ahead = ahead; }

    public int getBehind() { return behind; }
    public void setBehind(int behind) { this.behind = behind; }

    public String getLastCommitSha() { return lastCommitSha; }
    public void setLastCommitSha(String lastCommitSha) { this.lastCommitSha = lastCommitSha; }

    public String getLastCommitMessage() { return lastCommitMessage; }
    public void setLastCommitMessage(String lastCommitMessage) { this.lastCommitMessage = lastCommitMessage; }

    public Instant getLastCommitAt() { return lastCommitAt; }
    public void setLastCommitAt(Instant lastCommitAt) { this.lastCommitAt = lastCommitAt; }

    public Integer getPrNumber() { return prNumber; }
    public void setPrNumber(Integer prNumber) { this.prNumber = prNumber; }

    public String getPrTitle() { return prTitle; }
    public void setPrTitle(String prTitle) { this.prTitle = prTitle; }

    public String getPrStatus() { return prStatus; }
    public void setPrStatus(String prStatus) { this.prStatus = prStatus; }

    public boolean isPrConflicts() { return prConflicts; }
    public void setPrConflicts(boolean prConflicts) { this.prConflicts = prConflicts; }

    public Instant getPrOpenedAt() { return prOpenedAt; }
    public void setPrOpenedAt(Instant prOpenedAt) { this.prOpenedAt = prOpenedAt; }

    public int getPrReviewerCount() { return prReviewerCount; }
    public void setPrReviewerCount(int prReviewerCount) { this.prReviewerCount = prReviewerCount; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
