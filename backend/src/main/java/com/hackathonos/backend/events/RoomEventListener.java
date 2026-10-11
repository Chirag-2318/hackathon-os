package com.hackathonos.backend.events;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class RoomEventListener {

    private final RoomEventHub eventHub;

    public RoomEventListener(RoomEventHub eventHub) {
        this.eventHub = eventHub;
    }

    /**
     * Forwards room change event to SSE hub after database transaction commits.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onRoomChanged(RoomChangedEvent event) {
        eventHub.publish(event.roomId(), event.type());
        if (!"overview".equals(event.type())) {
            eventHub.publish(event.roomId(), "overview");
        }
    }
}
