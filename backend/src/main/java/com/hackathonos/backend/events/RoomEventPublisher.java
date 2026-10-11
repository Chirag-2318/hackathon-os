package com.hackathonos.backend.events;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class RoomEventPublisher {

    private final ApplicationEventPublisher publisher;

    public RoomEventPublisher(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    /**
     * Publishes a room change event through Spring's event bus.
     */
    public void publish(UUID roomId, String type) {
        if (roomId != null && type != null) {
            publisher.publishEvent(new RoomChangedEvent(roomId, type));
        }
    }
}
