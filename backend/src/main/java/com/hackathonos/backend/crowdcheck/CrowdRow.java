package com.hackathonos.backend.crowdcheck;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "crowd_rows")
public class CrowdRow {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "idea_id")
    private UUID ideaId;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "competitors", columnDefinition = "jsonb")
    private String competitors; // JSON list

    @Column(name = "crowdedness", nullable = false)
    private int crowdedness; // 1 to 5

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public CrowdRow() {}

    public CrowdRow(UUID roomId, UUID ideaId, String title, String competitors, int crowdedness, String notes) {
        this.roomId = roomId;
        this.ideaId = ideaId;
        this.title = title;
        this.competitors = competitors != null ? competitors : "[]";
        this.crowdedness = crowdedness;
        this.notes = notes != null ? notes : "";
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public UUID getIdeaId() { return ideaId; }
    public void setIdeaId(UUID ideaId) { this.ideaId = ideaId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCompetitors() { return competitors; }
    public void setCompetitors(String competitors) { this.competitors = competitors; }

    public int getCrowdedness() { return crowdedness; }
    public void setCrowdedness(int crowdedness) { this.crowdedness = crowdedness; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
