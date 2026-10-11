package com.hackathonos.backend.github;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "github_commits", uniqueConstraints = {
        @UniqueConstraint(name = "uq_github_commits_room_sha", columnNames = {"room_id", "sha"})
})
public class GithubCommit {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "sha", nullable = false, length = 64)
    private String sha;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "author_login")
    private String authorLogin;

    @Column(name = "author_name")
    private String authorName;

    @Column(name = "author_user_id")
    private UUID authorUserId;

    @Column(name = "committed_at", nullable = false)
    private Instant committedAt;

    @Column(name = "additions")
    private Integer additions;

    @Column(name = "deletions")
    private Integer deletions;

    @Column(name = "branch_name")
    private String branchName;

    public GithubCommit() {}

    public GithubCommit(UUID roomId, String sha, String message, String authorLogin,
                        String authorName, UUID authorUserId, Instant committedAt,
                        Integer additions, Integer deletions, String branchName) {
        this.roomId = roomId;
        this.sha = sha;
        this.message = message;
        this.authorLogin = authorLogin;
        this.authorName = authorName;
        this.authorUserId = authorUserId;
        this.committedAt = committedAt;
        this.additions = additions;
        this.deletions = deletions;
        this.branchName = branchName;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getSha() { return sha; }
    public void setSha(String sha) { this.sha = sha; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getAuthorLogin() { return authorLogin; }
    public void setAuthorLogin(String authorLogin) { this.authorLogin = authorLogin; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public UUID getAuthorUserId() { return authorUserId; }
    public void setAuthorUserId(UUID authorUserId) { this.authorUserId = authorUserId; }

    public Instant getCommittedAt() { return committedAt; }
    public void setCommittedAt(Instant committedAt) { this.committedAt = committedAt; }

    public Integer getAdditions() { return additions; }
    public void setAdditions(Integer additions) { this.additions = additions; }

    public Integer getDeletions() { return deletions; }
    public void setDeletions(Integer deletions) { this.deletions = deletions; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
}
