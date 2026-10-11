package com.hackathonos.backend.submission;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "submission_links")
public class SubmissionLink {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "label", nullable = false, length = 120)
    private String label;

    @Column(name = "url", nullable = false, length = 1000)
    private String url;

    @Column(name = "ok")
    private Boolean ok;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(name = "last_checked_at")
    private Instant lastCheckedAt;

    public SubmissionLink() {}

    public SubmissionLink(UUID roomId, String label, String url, Boolean ok, Integer httpStatus, Instant lastCheckedAt) {
        this.roomId = roomId;
        this.label = label;
        this.url = url;
        this.ok = ok;
        this.httpStatus = httpStatus;
        this.lastCheckedAt = lastCheckedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public Boolean getOk() { return ok; }
    public void setOk(Boolean ok) { this.ok = ok; }

    public Integer getHttpStatus() { return httpStatus; }
    public void setHttpStatus(Integer httpStatus) { this.httpStatus = httpStatus; }

    public Instant getLastCheckedAt() { return lastCheckedAt; }
    public void setLastCheckedAt(Instant lastCheckedAt) { this.lastCheckedAt = lastCheckedAt; }
}
