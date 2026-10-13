package com.hackathonos.backend.rooms;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.rooms.dto.*;
import com.hackathonos.backend.users.User;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomService roomService;
    private final RoomStageService stageService;
    private final RoomAccess roomAccess;
    private final CurrentUser currentUser;
    private final com.hackathonos.backend.common.idempotency.IdempotencyService idempotencyService;

    public RoomController(RoomService roomService, RoomStageService stageService, RoomAccess roomAccess, CurrentUser currentUser, com.hackathonos.backend.common.idempotency.IdempotencyService idempotencyService) {
        this.roomService = roomService;
        this.stageService = stageService;
        this.roomAccess = roomAccess;
        this.currentUser = currentUser;
        this.idempotencyService = idempotencyService;
    }

    @PostMapping
    public RoomDetailDto createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        User user = currentUser.get();
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var cached = idempotencyService.get(user.getId(), idempotencyKey);
            if (cached.isPresent() && cached.get() instanceof RoomDetailDto dto) {
                return dto;
            }
        }
        RoomDetailDto result = roomService.createRoom(user, request);
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            idempotencyService.put(user.getId(), idempotencyKey, result);
        }
        return result;
    }


    @GetMapping
    public List<RoomListItemDto> listRooms() {
        User user = currentUser.get();
        return roomService.listRooms(user);
    }

    @GetMapping("/suggest-name")
    public SuggestNameResponse suggestName() {
        User user = currentUser.get();
        return roomService.suggestName(user);
    }

    @GetMapping("/{roomId}")
    public RoomDetailDto getRoomDetail(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return roomService.getRoomDetail(user, roomId);
    }

    @PatchMapping("/{roomId}")
    public RoomDetailDto updateRoom(@PathVariable UUID roomId, @Valid @RequestBody UpdateRoomRequest request) {
        User user = currentUser.get();
        return roomService.updateRoom(user, roomId, request);
    }

    @DeleteMapping("/{roomId}")
    public void archiveRoom(@PathVariable UUID roomId) {
        User user = currentUser.get();
        roomService.archiveRoom(user, roomId);
    }

    @DeleteMapping("/{roomId}/soft-delete")
    public void deleteRoom(@PathVariable UUID roomId) {
        User user = currentUser.get();
        roomService.deleteRoom(user, roomId);
    }

    @PostMapping("/{roomId}/join-code/regenerate")
    public JoinCodeResponse regenerateJoinCode(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return roomService.regenerateJoinCode(user, roomId);
    }

    @PostMapping("/{roomId}/join-code/revoke")
    public void revokeJoinCode(@PathVariable UUID roomId) {
        User user = currentUser.get();
        roomService.revokeJoinCode(user, roomId);
    }

    @GetMapping("/{roomId}/journey")
    public JourneyDto getJourney(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return roomService.getJourney(user, roomId);
    }

    @PostMapping("/{roomId}/stage/advance")
    public RoomDetailDto advanceStage(@PathVariable UUID roomId, @RequestParam String targetStage) {
        User user = currentUser.get();
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        stageService.transitionForward(room, user, targetStage);
        return roomService.getRoomDetail(user, roomId);
    }

    @PostMapping("/{roomId}/stage/revert")
    public RoomDetailDto revertStage(@PathVariable UUID roomId) {
        User user = currentUser.get();
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        stageService.transitionBackward(room, user);
        return roomService.getRoomDetail(user, roomId);
    }
}
