package com.hackathonos.backend.diagrams;

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

    public DiagramController(DiagramService diagramService) {
        this.diagramService = diagramService;
    }

    @GetMapping
    public DiagramDtos.DiagramsResponse getDiagrams(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return diagramService.getDiagrams(roomId, user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DiagramDtos.DiagramItemDto createDiagram(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody DiagramDtos.CreateDiagramRequest request
    ) {
        return diagramService.createDiagram(roomId, user, request);
    }

    @PutMapping("/{id}")
    public DiagramDtos.DiagramItemDto updateDiagram(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody DiagramDtos.UpdateDiagramRequest request
    ) {
        return diagramService.updateDiagram(roomId, id, user, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDiagram(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        diagramService.deleteDiagram(roomId, id, user);
    }
}
