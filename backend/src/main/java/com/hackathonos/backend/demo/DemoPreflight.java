package com.hackathonos.backend.demo;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "demo_preflight")
public class DemoPreflight {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "item_hash", nullable = false, length = 100)
    private String itemHash;

    @Column(name = "label", nullable = false, length = 500)
    private String label;

    @Column(name = "checked", nullable = false)
    private boolean checked = false;

    @Column(name = "checked_by")
    private UUID checkedBy;

    @Column(name = "checked_at")
    private Instant checkedAt;

    @Column(name = "source", nullable = false, length = 50)
    private String source = "DEFAULT"; // DEFAULT, PLAN, USER

    @Column(name = "position", nullable = false)
    private int position = 0;

    public DemoPreflight() {}

    public DemoPreflight(UUID roomId, String itemHash, String label, String source, int position) {
        this.roomId = roomId;
        this.itemHash = itemHash;
        this.label = label;
        this.source = source;
        this.position = position;
        this.checked = false;
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

    public String getItemHash() {
        return itemHash;
    }

    public void setItemHash(String itemHash) {
        this.itemHash = itemHash;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public boolean isChecked() {
        return checked;
    }

    public void setChecked(boolean checked) {
        this.checked = checked;
    }

    public UUID getCheckedBy() {
        return checkedBy;
    }

    public void setCheckedBy(UUID checkedBy) {
        this.checkedBy = checkedBy;
    }

    public Instant getCheckedAt() {
        return checkedAt;
    }

    public void setCheckedAt(Instant checkedAt) {
        this.checkedAt = checkedAt;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }
}
