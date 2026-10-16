package com.hackathonos.backend.phases;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "room_phase_docs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"room_id", "phase_key", "doc_id"})
})
public class RoomPhaseDoc {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "phase_key", nullable = false, length = 20)
    private String phaseKey;

    @Column(name = "doc_id", nullable = false)
    private UUID docId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected RoomPhaseDoc() {}

    public RoomPhaseDoc(UUID roomId, String phaseKey, UUID docId) {
        this.roomId = roomId;
        this.phaseKey = phaseKey;
        this.docId = docId;
        this.createdAt = Instant.now();
    }

    public RoomPhaseDoc(UUID roomId, UUID phaseId, String phaseKey, UUID docId, String fileName, int version) {
        this(roomId, phaseKey, docId);
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getPhaseKey() { return phaseKey; }
    public void setPhaseKey(String phaseKey) { this.phaseKey = phaseKey; }

    public UUID getDocId() { return docId; }
    public void setDocId(UUID docId) { this.docId = docId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
