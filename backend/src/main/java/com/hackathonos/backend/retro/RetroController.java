package com.hackathonos.backend.retro;

import com.hackathonos.backend.users.User;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller for retrospective and project summary.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/retro")
public class RetroController {

    private final RetroService retroService;

    public RetroController(RetroService retroService) {
        this.retroService = retroService;
    }

    @GetMapping
    public RetroDtos.RetroResponse getRetro(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return retroService.getRetro(roomId, user);
    }

    @PatchMapping
    public RetroDtos.RetroResponse updateRetro(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody RetroDtos.UpdateRetroRequest req
    ) {
        return retroService.updateRetro(roomId, user, req);
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public RetroDtos.RetroItemDto addRetroItem(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody RetroDtos.CreateRetroItemRequest req
    ) {
        return retroService.addRetroItem(roomId, user, req);
    }

    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRetroItem(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        retroService.deleteRetroItem(roomId, id, user);
    }

    @PostMapping("/awards")
    @ResponseStatus(HttpStatus.CREATED)
    public RetroDtos.AwardDto addAward(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody RetroDtos.CreateAwardRequest req
    ) {
        return retroService.addAward(roomId, user, req);
    }

    @DeleteMapping("/awards/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAward(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        retroService.deleteAward(roomId, id, user);
    }
}
