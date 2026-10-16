package com.hackathonos.backend.demo;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "demo_insurance_items")
public class DemoInsuranceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "item_key", nullable = false, length = 60)
    private String itemKey;

    @Column(name = "label", nullable = false, columnDefinition = "text")
    private String label;

    @Column(name = "done", nullable = false)
    private boolean done;

    public DemoInsuranceItem() {}

    public DemoInsuranceItem(UUID roomId, String itemKey, String label, boolean done) {
        this.roomId = roomId;
        this.itemKey = itemKey;
        this.label = label;
        this.done = done;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getItemKey() { return itemKey; }
    public void setItemKey(String itemKey) { this.itemKey = itemKey; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }
}
