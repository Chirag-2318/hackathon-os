package com.hackathonos.backend.rooms;

import com.hackathonos.backend.common.security.CurrentUser;
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
    private final CurrentUser currentUser;

    public RoomController(RoomService roomService, CurrentUser currentUser) {
        this.roomService = roomService;
        this.currentUser = currentUser;
    }

    @PostMapping
    public RoomDetailDto createRoom(@Valid @RequestBody CreateRoomRequest request) {
        User user = currentUser.get();
        return roomService.createRoom(user, request);
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

    @PostMapping("/{roomId}/join-code/regenerate")
    public JoinCodeResponse regenerateJoinCode(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return roomService.regenerateJoinCode(user, roomId);
    }

    @GetMapping("/{roomId}/journey")
    public JourneyDto getJourney(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return roomService.getJourney(user, roomId);
    }
}
