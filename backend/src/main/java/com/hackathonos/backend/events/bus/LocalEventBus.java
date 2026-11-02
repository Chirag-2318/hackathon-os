package com.hackathonos.backend.events.bus;

import com.hackathonos.backend.events.RoomEventHub;
import com.hackathonos.backend.events.RoomEventHub.RoomEvent;

public class LocalEventBus implements EventBus {

    private final RoomEventHub eventHub;

    public LocalEventBus(RoomEventHub eventHub) {
        this.eventHub = eventHub;
    }

    @Override
    public void publish(RoomEvent event) {
        if (event != null) {
            eventHub.fanoutLocal(event);
        }
    }
}

