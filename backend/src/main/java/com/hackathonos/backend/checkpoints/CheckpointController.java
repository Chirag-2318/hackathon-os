package com.hackathonos.backend.checkpoints;

import com.hackathonos.backend.checkpoints.dto.CheckpointDtos.*;
import com.hackathonos.backend.common.security.CurrentUser;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/checkpoints")
public class CheckpointController {

    private final CheckpointService checkpointService;
    private final CurrentUser currentUser;

    public CheckpointController(CheckpointService checkpointService, CurrentUser currentUser) {
        this.checkpointService = checkpointService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public CheckpointsResponseDto getCheckpoints(@PathVariable UUID roomId) {
        return checkpointService.getCheckpoints(roomId, currentUser.get());
    }

    @PostMapping("/{id}/pass")
    public CheckpointItemDto passCheckpoint(@PathVariable UUID roomId,
                                            @PathVariable UUID id,
                                            @RequestBody PassCheckpointRequest request) {
        return checkpointService.passCheckpoint(roomId, currentUser.get(), id, request);
    }

    @PatchMapping("/{id}/progress")
    public CheckpointItemDto updateProgress(@PathVariable UUID roomId,
                                            @PathVariable UUID id,
                                            @RequestBody UpdateProgressRequest request) {
        return checkpointService.updateProgress(roomId, currentUser.get(), id, request);
    }
}
