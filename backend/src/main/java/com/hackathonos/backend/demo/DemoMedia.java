package com.hackathonos.backend.demo;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "demo_media")
public class DemoMedia {

    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "video_url", columnDefinition = "text")
    private String videoUrl;

    @Column(name = "fallback_url", columnDefinition = "text")
    private String fallbackUrl;

    @Column(name = "local_recording_saved", nullable = false)
    private boolean localRecordingSaved = false;

    @Column(name = "local_backup_saved", nullable = false)
    private boolean localBackupSaved = false;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public DemoMedia() {}

    public DemoMedia(UUID roomId, String videoUrl, String fallbackUrl, Instant updatedAt) {
        this.roomId = roomId;
        this.videoUrl = videoUrl;
        this.fallbackUrl = fallbackUrl;
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public String getFallbackUrl() { return fallbackUrl; }
    public void setFallbackUrl(String fallbackUrl) { this.fallbackUrl = fallbackUrl; }

    public boolean isLocalRecordingSaved() { return localRecordingSaved; }
    public void setLocalRecordingSaved(boolean localRecordingSaved) { this.localRecordingSaved = localRecordingSaved; }

    public boolean isLocalBackupSaved() { return localBackupSaved; }
    public void setLocalBackupSaved(boolean localBackupSaved) { this.localBackupSaved = localBackupSaved; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
