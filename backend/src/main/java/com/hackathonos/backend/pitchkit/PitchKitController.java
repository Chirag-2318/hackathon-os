package com.hackathonos.backend.pitchkit;

import com.hackathonos.backend.users.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/rooms/{roomId}/pitchkit", "/rooms/{roomId}/pitchkit"})
public class PitchKitController {

    private final PitchSettingsService settingsService;
    private final PitchKitReadinessService readinessService;

    public PitchKitController(PitchSettingsService settingsService, PitchKitReadinessService readinessService) {
        this.settingsService = settingsService;
        this.readinessService = readinessService;
    }

    @GetMapping("/settings")
    public PitchSettingsDtos.PitchSettingsDto getSettings(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return settingsService.getSettings(roomId, user);
    }

    @PatchMapping("/settings")
    public PitchSettingsDtos.PitchSettingsDto patchSettings(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PitchSettingsDtos.PatchPitchSettingsRequest req
    ) {
        return settingsService.patchSettings(roomId, user, req);
    }

    @GetMapping("/readiness")
    public PitchSettingsDtos.PitchKitReadinessResponse getReadiness(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return readinessService.getReadiness(roomId, user);
    }
}
