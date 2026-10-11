package com.hackathonos.backend.mvp;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "mvp_flow_steps")
public class MvpFlowStep {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(nullable = false)
    private int position = 0;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 20)
    private String status = "NOT_YET"; // WORKING, NOT_YET, MOCKED

    @Column(name = "task_id")
    private UUID taskId;

    protected MvpFlowStep() {}

    public MvpFlowStep(UUID roomId, int position, String title, String status, UUID taskId) {
        this.roomId = roomId;
        this.position = position;
        this.title = title;
        this.status = status != null ? status : "NOT_YET";
        this.taskId = taskId;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }
}
