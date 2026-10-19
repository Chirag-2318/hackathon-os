package com.hackathonos.backend.github;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "room_github_demo")
public class RoomGithubDemo {

    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "branch", nullable = false)
    private String branch;

    @Column(name = "sha", nullable = false, length = 64)
    private String sha;

    @Column(name = "marked_by")
    private UUID markedBy;

    @Column(name = "marked_at", nullable = false)
    private Instant markedAt = Instant.now();

    public RoomGithubDemo() {}

    public RoomGithubDemo(UUID roomId, String branch, String sha, UUID markedBy, Instant markedAt) {
        this.roomId = roomId;
        this.branch = branch;
        this.sha = sha;
        this.markedBy = markedBy;
        this.markedAt = markedAt != null ? markedAt : Instant.now();
    }

    public UUID getRoomId() {
        return roomId;
    }

    public void setRoomId(UUID roomId) {
        this.roomId = roomId;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public String getSha() {
        return sha;
    }

    public void setSha(String sha) {
        this.sha = sha;
    }

    public UUID getMarkedBy() {
        return markedBy;
    }

    public void setMarkedBy(UUID markedBy) {
        this.markedBy = markedBy;
    }

    public Instant getMarkedAt() {
        return markedAt;
    }

    public void setMarkedAt(Instant markedAt) {
        this.markedAt = markedAt;
    }
}
