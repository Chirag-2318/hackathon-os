package com.hackathonos.backend.demo;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class DemoLadderId implements Serializable {
    private UUID roomId;
    private String rung;

    public DemoLadderId() {}

    public DemoLadderId(UUID roomId, String rung) {
        this.roomId = roomId;
        this.rung = rung;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DemoLadderId that = (DemoLadderId) o;
        return Objects.equals(roomId, that.roomId) && Objects.equals(rung, that.rung);
    }

    @Override
    public int hashCode() {
        return Objects.hash(roomId, rung);
    }
}
