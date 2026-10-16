package com.hackathonos.backend.demo;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "demo_sections")
public class DemoSection {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "position", nullable = false)
    private int position;

    @Column(name = "title", nullable = false, columnDefinition = "text")
    private String title;

    @Column(name = "seconds", nullable = false)
    private int seconds;

    @Column(name = "text", columnDefinition = "TEXT")
    private String text;

    public DemoSection() {}

    public DemoSection(UUID roomId, int position, String title, int seconds, String text) {
        this.roomId = roomId;
        this.position = position;
        this.title = title;
        this.seconds = seconds;
        this.text = text != null ? text : "";
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public int getSeconds() { return seconds; }
    public void setSeconds(int seconds) { this.seconds = seconds; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
