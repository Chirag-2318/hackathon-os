package com.hackathonos.backend.events;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.events.dto.RoomEventDto.FeedResponse;
import com.hackathonos.backend.events.dto.RoomEventDto.LatestEventResponse;
import com.hackathonos.backend.users.User;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
public class RoomEventController {

    private final RoomEventService eventService;
    private final RoomAccess roomAccess;
    private final CurrentUser currentUser;

    public RoomEventController(RoomEventService eventService, RoomAccess roomAccess, CurrentUser currentUser) {
        this.eventService = eventService;
        this.roomAccess = roomAccess;
        this.currentUser = currentUser;
    }

    @GetMapping("/events")
    public FeedResponse getEvents(
            @PathVariable UUID roomId,
            @RequestParam(required = false, defaultValue = "0") Long after,
            @RequestParam(required = false, defaultValue = "50") Integer limit
    ) {
        User user = currentUser.get();
        roomAccess.requireMember(roomId, user);
        return eventService.getEvents(roomId, after, limit);
    }

    @GetMapping("/events/latest")
    public LatestEventResponse getLatestEventId(@PathVariable UUID roomId) {
        User user = currentUser.get();
        roomAccess.requireMember(roomId, user);
        return eventService.getLatestEventId(roomId);
    }
}
