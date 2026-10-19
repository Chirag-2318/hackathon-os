package com.hackathonos.backend.pitch;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deck_audits")
public class DeckAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "scope", nullable = false, length = 20)
    private String scope; // "SLIDE" or "DECK"

    @Column(name = "page_no")
    private Integer pageNo;

    @Column(name = "result", nullable = false, columnDefinition = "jsonb")
    private String result;

    @Column(name = "deck_hash", nullable = false, length = 64)
    private String deckHash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "created_by")
    private UUID createdBy;

    public DeckAudit() {}

    public DeckAudit(UUID roomId, String scope, Integer pageNo, String result, String deckHash, UUID createdBy) {
        this.roomId = roomId;
        this.scope = scope;
        this.pageNo = pageNo;
        this.result = result;
        this.deckHash = deckHash;
        this.createdBy = createdBy;
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

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public Integer getPageNo() {
        return pageNo;
    }

    public void setPageNo(Integer pageNo) {
        this.pageNo = pageNo;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getDeckHash() {
        return deckHash;
    }

    public void setDeckHash(String deckHash) {
        this.deckHash = deckHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }
}
