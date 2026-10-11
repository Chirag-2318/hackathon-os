package com.hackathonos.backend.submission;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "submission_checklist_items")
public class SubmissionChecklistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "item_key", nullable = false, length = 80)
    private String itemKey;

    @Column(name = "label", nullable = false, length = 255)
    private String label;

    @Column(name = "required", nullable = false)
    private boolean required;

    @Column(name = "done", nullable = false)
    private boolean done;

    @Column(name = "auto", nullable = false)
    private boolean auto;

    public SubmissionChecklistItem() {}

    public SubmissionChecklistItem(UUID roomId, String itemKey, String label, boolean required, boolean done, boolean auto) {
        this.roomId = roomId;
        this.itemKey = itemKey;
        this.label = label;
        this.required = required;
        this.done = done;
        this.auto = auto;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getItemKey() { return itemKey; }
    public void setItemKey(String itemKey) { this.itemKey = itemKey; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }

    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }

    public boolean isAuto() { return auto; }
    public void setAuto(boolean auto) { this.auto = auto; }
}
