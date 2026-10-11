package com.hackathonos.backend.github;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "github_frozen_demo")
public class GithubFrozenDemo {

    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "branch_name", nullable = false)
    private String branchName;

    @Column(name = "sha", nullable = false, length = 64)
    private String sha;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "tag", nullable = false, length = 60)
    private String tag;

    @Column(name = "frozen_at", nullable = false)
    private Instant frozenAt;

    @Column(name = "frozen_by")
    private UUID frozenBy;

    @Column(name = "commits_since", nullable = false)
    private int commitsSince;

    public GithubFrozenDemo() {}

    public GithubFrozenDemo(UUID roomId, String branchName, String sha, String message,
                            String tag, Instant frozenAt, UUID frozenBy, int commitsSince) {
        this.roomId = roomId;
        this.branchName = branchName;
        this.sha = sha;
        this.message = message;
        this.tag = tag;
        this.frozenAt = frozenAt != null ? frozenAt : Instant.now();
        this.frozenBy = frozenBy;
        this.commitsSince = commitsSince;
    }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public String getSha() { return sha; }
    public void setSha(String sha) { this.sha = sha; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }

    public Instant getFrozenAt() { return frozenAt; }
    public void setFrozenAt(Instant frozenAt) { this.frozenAt = frozenAt; }

    public UUID getFrozenBy() { return frozenBy; }
    public void setFrozenBy(UUID frozenBy) { this.frozenBy = frozenBy; }

    public int getCommitsSince() { return commitsSince; }
    public void setCommitsSince(int commitsSince) { this.commitsSince = commitsSince; }
}
