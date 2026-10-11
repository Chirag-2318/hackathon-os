package com.hackathonos.backend.retro;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "retro_awards")
public class RetroAward {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "detail", length = 255)
    private String detail;

    public RetroAward() {}

    public RetroAward(UUID roomId, String name, String detail) {
        this.roomId = roomId;
        this.name = name;
        this.detail = detail;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
}
