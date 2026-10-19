package com.hackathonos.backend.pitch;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.pitch.DeckAuditDtos.*;
import com.hackathonos.backend.users.User;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
public class DeckAuditController {

    private final DeckAuditService auditService;
    private final CurrentUser currentUser;

    public DeckAuditController(DeckAuditService auditService, CurrentUser currentUser) {
        this.auditService = auditService;
        this.currentUser = currentUser;
    }

    private User resolveUser(User user) {
        return user != null ? user : currentUser.get();
    }

    @PostMapping(value = {"/rooms/{roomId}/deck/slides", "/api/v1/rooms/{roomId}/deck/slides"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DeckSlidesResponse> uploadSlides(
            @PathVariable UUID roomId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(auditService.saveSlidesFromUpload(roomId, file, resolveUser(user)));
    }

    @PostMapping({"/rooms/{roomId}/deck/slides/text", "/api/v1/rooms/{roomId}/deck/slides/text"})
    public ResponseEntity<DeckSlidesResponse> saveSlidesText(
            @PathVariable UUID roomId,
            @RequestBody SaveSlideTextRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(auditService.saveSlidesFromText(roomId, request.text(), resolveUser(user)));
    }

    @GetMapping({"/rooms/{roomId}/deck/slides", "/api/v1/rooms/{roomId}/deck/slides"})
    public ResponseEntity<DeckSlidesResponse> getSlides(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(auditService.getSlides(roomId, resolveUser(user)));
    }

    @PostMapping({"/rooms/{roomId}/deck/audit", "/api/v1/rooms/{roomId}/deck/audit"})
    public ResponseEntity<?> audit(
            @PathVariable UUID roomId,
            @RequestBody(required = false) AuditRequest request,
            @AuthenticationPrincipal User user
    ) {
        if (request != null && request.page() != null) {
            return ResponseEntity.ok(auditService.auditSlide(roomId, request.page(), resolveUser(user)));
        } else {
            return ResponseEntity.ok(auditService.auditDeck(roomId, resolveUser(user)));
        }
    }

    @GetMapping({"/rooms/{roomId}/deck/audit", "/api/v1/rooms/{roomId}/deck/audit"})
    public ResponseEntity<?> getDeckAudit(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        DeckAuditResponse resp = auditService.getDeckAudit(roomId, resolveUser(user));
        return resp != null ? ResponseEntity.ok(resp) : ResponseEntity.noContent().build();
    }
}
