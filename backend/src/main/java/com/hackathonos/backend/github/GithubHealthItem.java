package com.hackathonos.backend.github;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "github_health_items", uniqueConstraints = {
        @UniqueConstraint(name = "uq_github_health_items_room_key", columnNames = {"room_id", "item_key"})
})
public class GithubHealthItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "item_key", nullable = false, length = 50)
    private String itemKey;

    @Column(name = "label", nullable = false)
    private String label;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // 'pass', 'fail'

    @Column(name = "required", nullable = false)
    private boolean required;

    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    @Column(name = "action_label")
    private String actionLabel;

    @Column(name = "action_url", columnDefinition = "TEXT")
    private String actionUrl;

    @Column(name = "checked_at", nullable = false)
    private Instant checkedAt;

    public GithubHealthItem() {}

    public GithubHealthItem(UUID roomId, String itemKey, String label, String status,
                            boolean required, String detail, String actionLabel,
                            String actionUrl, Instant checkedAt) {
        this.roomId = roomId;
        this.itemKey = itemKey;
        this.label = label;
        this.status = status != null ? status : "fail";
        this.required = required;
        this.detail = detail;
        this.actionLabel = actionLabel;
        this.actionUrl = actionUrl;
        this.checkedAt = checkedAt != null ? checkedAt : Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getItemKey() { return itemKey; }
    public void setItemKey(String itemKey) { this.itemKey = itemKey; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }

    public String getActionLabel() { return actionLabel; }
    public void setActionLabel(String actionLabel) { this.actionLabel = actionLabel; }

    public String getActionUrl() { return actionUrl; }
    public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }

    public Instant getCheckedAt() { return checkedAt; }
    public void setCheckedAt(Instant checkedAt) { this.checkedAt = checkedAt; }
}
