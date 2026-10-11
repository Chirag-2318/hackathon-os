package com.hackathonos.backend.events;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.users.User;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class EventStreamController {

    private final RoomEventHub eventHub;
    private final RoomAccess roomAccess;
    private final CurrentUser currentUser;

    public EventStreamController(RoomEventHub eventHub, RoomAccess roomAccess, CurrentUser currentUser) {
        this.eventHub = eventHub;
        this.roomAccess = roomAccess;
        this.currentUser = currentUser;
    }

    /**
     * Subscribes to real-time events for a specific room.
     */
    @GetMapping(value = "/rooms/{roomId}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter getRoomEvents(@PathVariable UUID roomId) {
        User user = currentUser.get();
        roomAccess.requireMember(roomId, user);
        return eventHub.subscribeRoom(roomId, user);
    }

    /**
     * Subscribes to personal real-time notification events.
     */
    @GetMapping(value = "/notifications/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter getNotificationStream() {
        User user = currentUser.get();
        return eventHub.subscribeNotifications(user);
    }
}
