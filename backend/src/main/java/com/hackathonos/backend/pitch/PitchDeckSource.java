package com.hackathonos.backend.pitch;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Stores the deck link or file reference for a room. One row per room. */
@Entity
@Table(name = "pitch_deck_sources")
public class PitchDeckSource {

    @Id
    @Column(name = "room_id")
    private UUID roomId;

    /** canva | pptx | gslides */
    @Column(name = "provider", nullable = false, length = 10)
    private String provider;

    @Column(name = "url", nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(name = "title", columnDefinition = "text")
    private String title = "";

    /** Local file path for uploaded PDF/PPTX (null for link-only sources). */
    @Column(name = "file_path", columnDefinition = "TEXT")
    private String filePath;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    /** Computed embed URL (Canva or Google Slides only). */
    @Column(name = "embed_url", columnDefinition = "TEXT")
    private String embedUrl;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public PitchDeckSource() {}

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title != null ? title : ""; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public String getEmbedUrl() { return embedUrl; }
    public void setEmbedUrl(String embedUrl) { this.embedUrl = embedUrl; }

    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
