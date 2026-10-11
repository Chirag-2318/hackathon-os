package com.hackathonos.backend.speedmode;

import com.hackathonos.backend.speedmode.SpeedModeDtos.*;
import com.hackathonos.backend.users.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/speed-mode")
public class SpeedModeController {

    private final SpeedModeService speedModeService;

    public SpeedModeController(SpeedModeService speedModeService) {
        this.speedModeService = speedModeService;
    }

    @GetMapping
    public SpeedModeResponseDto getSpeedMode(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return speedModeService.getSpeedMode(roomId, user);
    }

    @PostMapping("/tasks/{taskId}/done")
    public DoneTaskResponseDto markTaskDone(
            @PathVariable UUID roomId,
            @PathVariable UUID taskId,
            @AuthenticationPrincipal User user
    ) {
        return speedModeService.markTaskDone(roomId, taskId, user);
    }

    @PostMapping("/capture")
    public SpeedModeCaptureDto capture(
            @PathVariable UUID roomId,
            @RequestBody CaptureRequest req,
            @AuthenticationPrincipal User user
    ) {
        return speedModeService.capture(roomId, req.text(), user);
    }

    @GetMapping("/captures")
    public List<SpeedModeCaptureDto> listCaptures(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return speedModeService.listCaptures(roomId, user);
    }

    @DeleteMapping("/captures/{captureId}")
    public ResponseEntity<Void> deleteCapture(
            @PathVariable UUID roomId,
            @PathVariable UUID captureId,
            @AuthenticationPrincipal User user
    ) {
        speedModeService.deleteCapture(roomId, captureId, user);
        return ResponseEntity.noContent().build();
    }
}
