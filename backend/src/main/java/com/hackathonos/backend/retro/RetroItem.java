package com.hackathonos.backend.retro;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "retro_items")
public class RetroItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "kind", nullable = false, length = 30)
    private String kind; // 'WENT_WELL', 'DIDNT_GO', 'CHANGE'

    @Column(name = "text", nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "tag", length = 50)
    private String tag; // overscope, late-testing, unread-ai-code, no-rehearsal, conflict, wifi-failure, rules-miss

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public RetroItem() {}

    public RetroItem(UUID roomId, String kind, String text, String tag, UUID authorId, Instant createdAt) {
        this.roomId = roomId;
        this.kind = kind;
        this.text = text;
        this.tag = tag;
        this.authorId = authorId;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }

    public UUID getAuthorId() { return authorId; }
    public void setAuthorId(UUID authorId) { this.authorId = authorId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
