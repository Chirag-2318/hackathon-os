package com.hackathonos.backend.rooms.export;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.rooms.export.dto.RoomEndSummaryDto;
import com.hackathonos.backend.users.User;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
public class RoomExportController {

    private final RoomExportService exportService;
    private final CurrentUser currentUser;

    public RoomExportController(RoomExportService exportService, CurrentUser currentUser) {
        this.exportService = exportService;
        this.currentUser = currentUser;
    }

    /**
     * Downloads an offline ZIP archive containing all room artifacts.
     */
    @GetMapping(value = {"/export", "/export.zip"}, produces = "application/zip")
    public ResponseEntity<byte[]> exportRoom(@PathVariable UUID roomId) {
        User user = currentUser.get();
        byte[] zipBytes = exportService.buildRoomExportZip(roomId, user);
        String filename = exportService.getExportFilename(roomId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(zipBytes);
    }

    /**
     * Retrieves end-of-event milestone summary, project links, team stats, and retro highlights.
     */
    @GetMapping("/summary")
    public RoomEndSummaryDto getRoomSummary(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return exportService.buildRoomSummary(roomId, user);
    }

    /**
     * Commits room documentation to GitHub repository on a new branch and opens a PR.
     * Leader-only.
     */
    @PostMapping("/export/push-docs")
    public Map<String, Object> pushDocsToGithub(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return exportService.pushDocsToGithub(roomId, user);
    }
}
