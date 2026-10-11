package com.hackathonos.backend.demo;

import com.hackathonos.backend.users.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for demo scripts, shots, insurance, and media links.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/demo")
public class DemoController {

    private final DemoService demoService;

    public DemoController(DemoService demoService) {
        this.demoService = demoService;
    }

    @GetMapping
    public DemoDtos.DemoResponse getDemo(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return demoService.getDemo(roomId, user);
    }

    @PutMapping("/sections")
    public List<DemoDtos.DemoSectionDto> updateSections(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody DemoDtos.UpdateSectionsRequest req
    ) {
        return demoService.updateSections(roomId, user, req);
    }

    @PutMapping("/shots")
    public List<DemoDtos.DemoShotDto> updateShots(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody DemoDtos.UpdateShotsRequest req
    ) {
        return demoService.updateShots(roomId, user, req);
    }

    @PatchMapping("/insurance/{key}")
    public DemoDtos.InsuranceItemDto toggleInsurance(
            @PathVariable UUID roomId,
            @PathVariable String key,
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) DemoDtos.ToggleInsuranceRequest req
    ) {
        return demoService.toggleInsurance(roomId, key, user, req != null ? req : new DemoDtos.ToggleInsuranceRequest(null));
    }

    @PutMapping("/media")
    public DemoDtos.DemoMediaDto updateMedia(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody DemoDtos.UpdateMediaRequest req
    ) {
        return demoService.updateMedia(roomId, user, req);
    }
}
