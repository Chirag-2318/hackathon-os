package com.hackathonos.backend.demo;

import com.hackathonos.backend.users.User;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/rooms/{roomId}/demo", "/rooms/{roomId}/demo"})
public class DemoStationController {

    private final DemoStationService demoStationService;

    public DemoStationController(DemoStationService demoStationService) {
        this.demoStationService = demoStationService;
    }

    // ── ASSETS ────────────────────────────────────────────────────────

    @GetMapping("/assets")
    public List<DemoStationDtos.DemoAssetDto> getAssets(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return demoStationService.getAssets(roomId, user);
    }

    @PostMapping("/assets")
    public DemoStationDtos.DemoAssetDto addLink(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody DemoStationDtos.CreateLinkAssetRequest req
    ) {
        return demoStationService.addOrUpdateLink(roomId, user, req);
    }

    @PostMapping(value = "/assets/screenshot", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DemoStationDtos.DemoAssetDto uploadScreenshot(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file
    ) {
        return demoStationService.uploadScreenshot(roomId, user, file);
    }

    @PatchMapping("/assets/{assetId}")
    public DemoStationDtos.DemoAssetDto updateAsset(
            @PathVariable UUID roomId,
            @PathVariable UUID assetId,
            @AuthenticationPrincipal User user,
            @RequestBody DemoStationDtos.UpdateAssetRequest req
    ) {
        return demoStationService.updateAsset(roomId, user, assetId, req);
    }

    @DeleteMapping("/assets/{assetId}")
    public ResponseEntity<Void> deleteAsset(
            @PathVariable UUID roomId,
            @PathVariable UUID assetId,
            @AuthenticationPrincipal User user
    ) {
        demoStationService.deleteAsset(roomId, user, assetId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/assets/{assetId}/check")
    public DemoStationDtos.DemoAssetDto checkAssetLink(
            @PathVariable UUID roomId,
            @PathVariable UUID assetId,
            @AuthenticationPrincipal User user
    ) {
        return demoStationService.checkAssetLink(roomId, user, assetId);
    }

    @GetMapping("/assets/{assetId}/file")
    public ResponseEntity<Resource> getScreenshotFile(
            @PathVariable UUID roomId,
            @PathVariable UUID assetId,
            @AuthenticationPrincipal User user
    ) {
        Resource file = demoStationService.getScreenshotFile(roomId, user, assetId);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=86400")
                .body(file);
    }

    @GetMapping("/assets/zip")
    public ResponseEntity<byte[]> downloadScreenshotsZip(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        byte[] zipBytes = demoStationService.downloadAllScreenshotsZip(roomId, user);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"screenshots-" + roomId + ".zip\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(zipBytes);
    }

    // ── LADDER ────────────────────────────────────────────────────────

    @GetMapping("/ladder")
    public List<DemoStationDtos.DemoLadderRungDto> getLadder(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return demoStationService.getLadder(roomId, user);
    }

    @PatchMapping("/ladder/{rung}")
    public DemoStationDtos.DemoLadderRungDto updateLadderRung(
            @PathVariable UUID roomId,
            @PathVariable String rung,
            @AuthenticationPrincipal User user,
            @RequestBody DemoStationDtos.UpdateLadderRungRequest req
    ) {
        return demoStationService.updateLadderRung(roomId, user, rung, req);
    }

    @PostMapping("/ladder/{rung}/test")
    public DemoStationDtos.DemoLadderRungDto testLadderRung(
            @PathVariable UUID roomId,
            @PathVariable String rung,
            @AuthenticationPrincipal User user
    ) {
        return demoStationService.testLadderRung(roomId, user, rung);
    }

    // ── PREFLIGHT ─────────────────────────────────────────────────────

    @GetMapping("/preflight")
    public List<DemoStationDtos.DemoPreflightItemDto> getPreflight(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return demoStationService.getPreflight(roomId, user);
    }

    @PostMapping("/preflight")
    public DemoStationDtos.DemoPreflightItemDto addPreflightItem(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody DemoStationDtos.CreatePreflightRequest req
    ) {
        return demoStationService.addPreflightItem(roomId, user, req);
    }

    @PatchMapping("/preflight/{itemId}")
    public DemoStationDtos.DemoPreflightItemDto togglePreflight(
            @PathVariable UUID roomId,
            @PathVariable UUID itemId,
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) DemoStationDtos.TogglePreflightRequest req
    ) {
        return demoStationService.togglePreflight(roomId, user, itemId, req);
    }

    @PostMapping("/preflight/reset")
    public ResponseEntity<Void> resetPreflight(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        demoStationService.resetPreflight(roomId, user);
        return ResponseEntity.noContent().build();
    }
}
