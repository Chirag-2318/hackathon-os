package com.hackathonos.backend.diagrams;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller for managing diagrams in a room.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/diagrams")
public class DiagramController {

    private final DiagramService diagramService;
    private final CurrentUser currentUser;

    public DiagramController(DiagramService diagramService, CurrentUser currentUser) {
        this.diagramService = diagramService;
        this.currentUser = currentUser;
    }

    private User resolveUser(User user) {
        return user != null ? user : currentUser.get();
    }

    @GetMapping
    public DiagramDtos.DiagramsResponse getDiagrams(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return diagramService.getDiagrams(roomId, resolveUser(user));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DiagramDtos.DiagramItemDto createDiagram(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody DiagramDtos.CreateDiagramRequest request
    ) {
        return diagramService.createDiagram(roomId, resolveUser(user), request);
    }

    @PutMapping("/{id}")
    public DiagramDtos.DiagramItemDto updateDiagram(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody DiagramDtos.UpdateDiagramRequest request
    ) {
        return diagramService.updateDiagram(roomId, id, resolveUser(user), request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDiagram(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        diagramService.deleteDiagram(roomId, id, resolveUser(user));
    }
}
