package com.hackathonos.backend.presence;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.docs.DocService;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.dto.UserSummaryDto;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
public class PresenceController {

    private final PresenceService presenceService;
    private final RoomAccess roomAccess;
    private final CurrentUser currentUser;
    private final ObjectProvider<DocService> docServiceProvider;

    public PresenceController(PresenceService presenceService,
                              RoomAccess roomAccess,
                              CurrentUser currentUser,
                              ObjectProvider<DocService> docServiceProvider) {
        this.presenceService = presenceService;
        this.roomAccess = roomAccess;
        this.currentUser = currentUser;
        this.docServiceProvider = docServiceProvider;
    }

    @PostMapping({"/presence", "/presence/heartbeat", "/heartbeat"})
    public ResponseEntity<Void> sendHeartbeat(
            @PathVariable UUID roomId,
            @RequestParam(value = "editingDoc", required = false) String editingDoc
    ) {
        User user = currentUser.get();
        roomAccess.requireMember(roomId, user);
        presenceService.heartbeat(roomId, user.getId());
        if (editingDoc != null && !editingDoc.isBlank()) {
            docServiceProvider.ifAvailable(ds -> ds.touchEditingDoc(roomId, editingDoc, user));
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping({"/presence/members", "/presence/online-members"})
    public List<UserSummaryDto> getOnlineMembers(@PathVariable UUID roomId) {
        User user = currentUser.get();
        roomAccess.requireMember(roomId, user);
        return presenceService.getOnlineMembers(roomId);
    }
}
