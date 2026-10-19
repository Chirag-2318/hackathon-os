package com.hackathonos.backend.demo;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "demo_assets")
public class DemoAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "kind", nullable = false, length = 50)
    private String kind; // FULL_RECORDING, BACKUP_RECORDING, LIVE_LINK, SCREENSHOT

    @Column(name = "url", length = 2000)
    private String url;

    @Column(name = "provider", length = 50)
    private String provider;

    @Column(name = "title", length = 500)
    private String title;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "NOT_ADDED";

    @Column(name = "checked_at")
    private Instant checkedAt;

    @Column(name = "caption", length = 1000)
    private String caption;

    @Column(name = "position", nullable = false)
    private int position = 0;

    @Column(name = "file_key", length = 500)
    private String fileKey;

    @Column(name = "added_by")
    private UUID addedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public DemoAsset() {}

    public DemoAsset(UUID roomId, String kind, String url, String provider, String title, String status, UUID addedBy) {
        this.roomId = roomId;
        this.kind = kind;
        this.url = url;
        this.provider = provider;
        this.title = title;
        this.status = status;
        this.addedBy = addedBy;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getRoomId() {
        return roomId;
    }

    public void setRoomId(UUID roomId) {
        this.roomId = roomId;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCheckedAt() {
        return checkedAt;
    }

    public void setCheckedAt(Instant checkedAt) {
        this.checkedAt = checkedAt;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public String getFileKey() {
        return fileKey;
    }

    public void setFileKey(String fileKey) {
        this.fileKey = fileKey;
    }

    public UUID getAddedBy() {
        return addedBy;
    }

    public void setAddedBy(UUID addedBy) {
        this.addedBy = addedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
