package com.hackathonos.backend.rooms.export;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    @GetMapping(value = "/export.zip", produces = "application/zip")
    public ResponseEntity<byte[]> exportRoom(@PathVariable UUID roomId) {
        User user = currentUser.get();
        byte[] zipBytes = exportService.buildRoomExportZip(roomId, user);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"room-export-" + roomId + ".zip\"")
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(zipBytes);
    }
}
