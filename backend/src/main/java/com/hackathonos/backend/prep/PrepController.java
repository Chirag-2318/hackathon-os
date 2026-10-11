package com.hackathonos.backend.prep;

import com.hackathonos.backend.users.User;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller for pre-event preparation and laptop readiness checklist.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/prep")
public class PrepController {

    private final PrepService prepService;

    public PrepController(PrepService prepService) {
        this.prepService = prepService;
    }

    @GetMapping
    public PrepDtos.PrepResponse getPrep(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return prepService.getPrep(roomId, user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PrepDtos.PrepChecklistItemDto createItem(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PrepDtos.CreatePrepItemRequest req
    ) {
        return prepService.createItem(roomId, user, req);
    }

    @PatchMapping("/checklist/{itemId}")
    public PrepDtos.PrepChecklistItemDto toggleItem(
            @PathVariable UUID roomId,
            @PathVariable UUID itemId,
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) PrepDtos.TogglePrepItemRequest req
    ) {
        return prepService.toggleItem(roomId, itemId, user, req != null ? req : new PrepDtos.TogglePrepItemRequest(null));
    }

    @DeleteMapping("/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(
            @PathVariable UUID roomId,
            @PathVariable UUID itemId,
            @AuthenticationPrincipal User user
    ) {
        prepService.deleteItem(roomId, itemId, user);
    }
}
