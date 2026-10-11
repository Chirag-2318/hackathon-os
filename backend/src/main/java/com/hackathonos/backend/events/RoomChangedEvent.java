package com.hackathonos.backend.events;

import java.time.Instant;
import java.util.UUID;

public record RoomChangedEvent(UUID roomId, String type, Instant at) {
    public RoomChangedEvent(UUID roomId, String type) {
        this(roomId, type, Instant.now());
    }
}
