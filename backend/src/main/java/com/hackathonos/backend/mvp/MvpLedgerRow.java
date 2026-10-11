package com.hackathonos.backend.mvp;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "mvp_ledger_rows")
public class MvpLedgerRow {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(nullable = false)
    private int position = 0;

    @Column(nullable = false, length = 255)
    private String part;

    @Column(nullable = false, length = 20)
    private String status = "PLANNED"; // BUILT, EXISTING, MOCKED, PLANNED

    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(name = "task_id")
    private UUID taskId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    protected MvpLedgerRow() {}

    public MvpLedgerRow(UUID roomId, int position, String part, String status, UUID ownerId, UUID taskId, String notes) {
        this.roomId = roomId;
        this.position = position;
        this.part = part;
        this.status = status != null ? status : "PLANNED";
        this.ownerId = ownerId;
        this.taskId = taskId;
        this.notes = notes;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public String getPart() { return part; }
    public void setPart(String part) { this.part = part; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
