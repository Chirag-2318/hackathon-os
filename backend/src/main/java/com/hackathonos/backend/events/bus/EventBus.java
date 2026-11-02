package com.hackathonos.backend.events.bus;

import com.hackathonos.backend.events.RoomEventHub.RoomEvent;

public interface EventBus {
    void publish(RoomEvent event);
}

