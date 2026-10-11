package com.hackathonos.backend.pitch;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pitch_decks")
public class PitchDeck {

    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "format_kind", nullable = false, length = 30)
    private String formatKind; // 'live_3min', 'ppt_first', 'demo_90s', 'async_video'

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public PitchDeck() {}

    public PitchDeck(UUID roomId, String formatKind, Instant updatedAt) {
        this.roomId = roomId;
        this.formatKind = formatKind;
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getFormatKind() { return formatKind; }
    public void setFormatKind(String formatKind) { this.formatKind = formatKind; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
