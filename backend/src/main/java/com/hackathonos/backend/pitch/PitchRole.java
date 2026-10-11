package com.hackathonos.backend.pitch;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "pitch_roles")
public class PitchRole {

    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "presenter_id")
    private UUID presenterId;

    @Column(name = "operator_id")
    private UUID operatorId;

    public PitchRole() {}

    public PitchRole(UUID roomId, UUID presenterId, UUID operatorId) {
        this.roomId = roomId;
        this.presenterId = presenterId;
        this.operatorId = operatorId;
    }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public UUID getPresenterId() { return presenterId; }
    public void setPresenterId(UUID presenterId) { this.presenterId = presenterId; }

    public UUID getOperatorId() { return operatorId; }
    public void setOperatorId(UUID operatorId) { this.operatorId = operatorId; }
}
