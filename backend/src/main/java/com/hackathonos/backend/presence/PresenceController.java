package com.hackathonos.backend.presence;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.dto.UserSummaryDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/presence")
public class PresenceController {

    private final PresenceService presenceService;
    private final RoomAccess roomAccess;
    private final CurrentUser currentUser;

    public PresenceController(PresenceService presenceService, RoomAccess roomAccess, CurrentUser currentUser) {
        this.presenceService = presenceService;
        this.roomAccess = roomAccess;
        this.currentUser = currentUser;
    }

    @PostMapping({"", "/heartbeat"})
    public ResponseEntity<Void> sendHeartbeat(@PathVariable UUID roomId) {
        User user = currentUser.get();
        roomAccess.requireMember(roomId, user);
        presenceService.heartbeat(roomId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public List<UserSummaryDto> getOnlineMembers(@PathVariable UUID roomId) {
        User user = currentUser.get();
        roomAccess.requireMember(roomId, user);
        return presenceService.getOnlineMembers(roomId);
    }
}
