package com.hackathonos.backend.mvp;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "mvp_cut_items")
public class MvpCutItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(nullable = false)
    private int position = 0;

    @Column(nullable = false, length = 255)
    private String text;

    @Column(name = "is_cut", nullable = false)
    private boolean isCut = false;

    protected MvpCutItem() {}

    public MvpCutItem(UUID roomId, int position, String text, boolean isCut) {
        this.roomId = roomId;
        this.position = position;
        this.text = text;
        this.isCut = isCut;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public boolean isCut() { return isCut; }
    public void setCut(boolean cut) { isCut = cut; }
}
