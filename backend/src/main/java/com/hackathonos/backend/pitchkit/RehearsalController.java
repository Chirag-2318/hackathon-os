package com.hackathonos.backend.pitchkit;

import com.hackathonos.backend.pitchkit.RehearsalDtos.*;
import com.hackathonos.backend.users.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/rooms/{roomId}/rehearsals", "/rooms/{roomId}/rehearsals"})
public class RehearsalController {

    private final RehearsalService rehearsalService;

    public RehearsalController(RehearsalService rehearsalService) {
        this.rehearsalService = rehearsalService;
    }

    @PostMapping
    public StartRehearsalResponse startRehearsal(
            @PathVariable UUID roomId,
            @RequestBody StartRehearsalRequest req,
            @AuthenticationPrincipal User user
    ) {
        return rehearsalService.startRehearsal(roomId, req, user);
    }

    @PostMapping("/{rid}/audio")
    public Map<String, String> uploadAudio(
            @PathVariable UUID roomId,
            @PathVariable UUID rid,
            @RequestParam("beat") String beatId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        return rehearsalService.uploadAudio(roomId, rid, beatId, file, user);
    }

    @PostMapping("/{rid}/finish")
    public RehearsalDetailResponse finishRehearsal(
            @PathVariable UUID roomId,
            @PathVariable UUID rid,
            @RequestBody FinishRehearsalRequest req,
            @AuthenticationPrincipal User user
    ) {
        return rehearsalService.finishRehearsal(roomId, rid, req, user);
    }

    @PostMapping("/{rid}/coach")
    public CoachFeedbackDto getCoach(
            @PathVariable UUID roomId,
            @PathVariable UUID rid,
            @AuthenticationPrincipal User user
    ) {
        return rehearsalService.getCoachFeedback(roomId, rid, user);
    }

    @GetMapping
    public List<RehearsalSummaryResponse> listRehearsals(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return rehearsalService.listRehearsals(roomId, user);
    }

    @GetMapping("/{rid}")
    public RehearsalDetailResponse getRehearsal(
            @PathVariable UUID roomId,
            @PathVariable UUID rid,
            @AuthenticationPrincipal User user
    ) {
        return rehearsalService.getRehearsal(roomId, rid, user);
    }

    @DeleteMapping("/{rid}")
    public void deleteRehearsal(
            @PathVariable UUID roomId,
            @PathVariable UUID rid,
            @AuthenticationPrincipal User user
    ) {
        rehearsalService.deleteRehearsal(roomId, rid, user);
    }
}
