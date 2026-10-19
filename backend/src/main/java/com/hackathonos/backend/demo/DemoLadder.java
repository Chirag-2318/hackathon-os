package com.hackathonos.backend.demo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "demo_ladder")
@IdClass(DemoLadderId.class)
public class DemoLadder {

    @Id
    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Id
    @Column(name = "rung", nullable = false, length = 10)
    private String rung; // A, B, C, D

    @Column(name = "say_text", length = 300)
    private String sayText;

    @Column(name = "tested_at")
    private Instant testedAt;

    @Column(name = "tested_by")
    private UUID testedBy;

    public DemoLadder() {}

    public DemoLadder(UUID roomId, String rung, String sayText) {
        this.roomId = roomId;
        this.rung = rung;
        this.sayText = sayText;
    }

    public UUID getRoomId() {
        return roomId;
    }

    public void setRoomId(UUID roomId) {
        this.roomId = roomId;
    }

    public String getRung() {
        return rung;
    }

    public void setRung(String rung) {
        this.rung = rung;
    }

    public String getSayText() {
        return sayText;
    }

    public void setSayText(String sayText) {
        this.sayText = sayText;
    }

    public Instant getTestedAt() {
        return testedAt;
    }

    public void setTestedAt(Instant testedAt) {
        this.testedAt = testedAt;
    }

    public UUID getTestedBy() {
        return testedBy;
    }

    public void setTestedBy(UUID testedBy) {
        this.testedBy = testedBy;
    }
}
