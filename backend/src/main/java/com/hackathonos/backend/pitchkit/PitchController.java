package com.hackathonos.backend.pitchkit;

import com.hackathonos.backend.pitchkit.PitchDtos.*;
import com.hackathonos.backend.users.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController("pitchKitPitchController")
@RequestMapping({"/api/v1/rooms/{roomId}/pitch", "/rooms/{roomId}/pitch"})
public class PitchController {

    private final PitchService pitchService;

    public PitchController(PitchService pitchService) {
        this.pitchService = pitchService;
    }

    @GetMapping
    public PitchDetailResponse getPitch(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return pitchService.getPitch(roomId, user);
    }

    @PutMapping
    public PitchDetailResponse updatePitch(
            @PathVariable UUID roomId,
            @RequestBody UpdatePitchRequest req,
            @AuthenticationPrincipal User user
    ) {
        return pitchService.updatePitch(roomId, req, user);
    }

    @PostMapping("/pull-from-doc")
    public PullFromDocResponse pullFromDoc(
            @PathVariable UUID roomId,
            @RequestParam(defaultValue = "false") boolean confirm,
            @AuthenticationPrincipal User user
    ) {
        return pitchService.pullFromDoc(roomId, confirm, user);
    }

    @PostMapping("/push-to-doc")
    public PushToDocResponse pushToDoc(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return pitchService.pushToDoc(roomId, user);
    }

    @GetMapping("/versions")
    public List<PitchVersionSummary> getVersions(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return pitchService.getVersions(roomId, user);
    }

    @PostMapping("/versions/{version}/restore")
    public PitchDetailResponse restoreVersion(
            @PathVariable UUID roomId,
            @PathVariable int version,
            @AuthenticationPrincipal User user
    ) {
        return pitchService.restoreVersion(roomId, version, user);
    }

    @GetMapping("/coverage")
    public List<RubricCoverageDto> getCoverage(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return pitchService.getCoverage(roomId, user);
    }

    @PostMapping("/ai-edit")
    public PitchAiEditResponse aiEdit(
            @PathVariable UUID roomId,
            @RequestBody PitchAiEditRequest req,
            @AuthenticationPrincipal User user
    ) {
        return pitchService.aiEdit(roomId, req, user);
    }
}
