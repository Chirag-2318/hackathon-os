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
    public org.springframework.http.ResponseEntity<List<RehearsalSummaryResponse>> listRehearsals(
            @PathVariable UUID roomId,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer page,
            @AuthenticationPrincipal User user
    ) {
        List<RehearsalSummaryResponse> all = rehearsalService.listRehearsals(roomId, user);
        int total = all.size();
        int safeLimit = (limit != null && limit > 0) ? Math.min(limit, 500) : 500;
        int pageNum = (page != null && page >= 0) ? page : 0;
        int fromIndex = Math.min(pageNum * safeLimit, total);
        int toIndex = Math.min(fromIndex + safeLimit, total);
        List<RehearsalSummaryResponse> pageItems = all.subList(fromIndex, toIndex);

        var response = org.springframework.http.ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(total));
        if (total > safeLimit || toIndex < total) {
            response.header("X-Truncated", "true");
        }
        return response.body(pageItems);
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
