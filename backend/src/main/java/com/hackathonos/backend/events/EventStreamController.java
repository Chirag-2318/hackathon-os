package com.hackathonos.backend.events;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.users.User;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
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
     * Subscribes to real-time events for a specific room with replay and SSE headers.
     */
    @GetMapping(value = "/rooms/{roomId}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter getRoomEvents(
            @PathVariable UUID roomId,
            @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId,
            HttpServletResponse response
    ) {
        User user = currentUser.get();
        roomAccess.requireMember(roomId, user);

        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no");

        return eventHub.subscribe(roomId, user, lastEventId);
    }

    /**
     * Retrieves currently online member IDs for a room from the event hub.
     */
    @GetMapping("/rooms/{roomId}/presence")
    public Map<String, Object> getPresence(@PathVariable UUID roomId) {
        User user = currentUser.get();
        roomAccess.requireMember(roomId, user);
        return Map.of("online", eventHub.onlineUserIds(roomId));
    }

    /**
     * Subscribes to personal real-time notification events.
     */
    @GetMapping(value = "/notifications/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter getNotificationStream(HttpServletResponse response) {
        User user = currentUser.get();
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no");
        return eventHub.subscribeNotifications(user);
    }
}
