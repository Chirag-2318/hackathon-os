package com.hackathonos.backend.pitch;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.hackathonos.backend.users.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller for Pitch Deck, Rehearsals, and Q&A defense.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/pitch")
public class PitchController {

    private final PitchDeckService deckService;
    private final PitchRehearsalService rehearsalService;
    private final PitchQaService qaService;

    public PitchController(
            PitchDeckService deckService,
            PitchRehearsalService rehearsalService,
            PitchQaService qaService
    ) {
        this.deckService = deckService;
        this.rehearsalService = rehearsalService;
        this.qaService = qaService;
    }

    // ── DECK ─────────────────────────────────────────────────────────

    @GetMapping("/deck")
    public PitchDtos.PitchDeckResponse getDeck(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return deckService.getDeck(roomId, user);
    }

    @PutMapping("/deck/format")
    public PitchDtos.PitchDeckResponse updateFormat(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDtos.UpdateFormatRequest req
    ) {
        return deckService.updateFormat(roomId, user, req);
    }

    @PostMapping("/deck/slides")
    @ResponseStatus(HttpStatus.CREATED)
    public PitchDtos.SlideDto createSlide(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDtos.CreateSlideRequest req
    ) {
        return deckService.createSlide(roomId, user, req);
    }

    @PutMapping("/slides/{id}")
    public PitchDtos.SlideDto updateSlide(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDtos.UpdateSlideRequest req
    ) {
        return deckService.updateSlide(roomId, id, user, req);
    }

    @DeleteMapping("/slides/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSlide(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        deckService.deleteSlide(roomId, id, user);
    }

    @PutMapping("/deck/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorderSlides(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDtos.ReorderSlidesRequest req
    ) {
        deckService.reorderSlides(roomId, user, req);
    }

    @PutMapping("/slides/{id}/coverage")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateCoverage(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDtos.UpdateCoverageRequest req
    ) {
        deckService.updateCoverage(roomId, id, user, req);
    }

    @GetMapping(value = "/deck/export.md", produces = MediaType.TEXT_MARKDOWN_VALUE)
    public String exportMarkdown(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return deckService.exportMarkdown(roomId, user);
    }

    @PostMapping("/deck/slides/{id}/draft")
    public PitchDtos.DraftSlideResponse draftSlide(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        return deckService.draftSlide(roomId, id, user);
    }

    // ── REHEARSE ─────────────────────────────────────────────────────

    @GetMapping("/rehearse")
    public PitchDtos.RehearseResponse getRehearsals(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return rehearsalService.getRehearsals(roomId, user);
    }

    @PostMapping("/rehearse/runs")
    @ResponseStatus(HttpStatus.CREATED)
    public PitchDtos.RehearsalRunDto addRun(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDtos.CreateRunRequest req
    ) {
        return rehearsalService.addRun(roomId, user, req);
    }

    @DeleteMapping("/rehearse/runs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRun(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        rehearsalService.deleteRun(roomId, id, user);
    }

    @PutMapping("/rehearse/roles")
    public PitchDtos.PitchRolesDto setRoles(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDtos.UpdateRolesRequest req
    ) {
        return rehearsalService.setRoles(roomId, user, req);
    }

    // ── Q&A ──────────────────────────────────────────────────────────

    @GetMapping("/qa")
    public PitchDtos.QaResponse getQa(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return qaService.getQa(roomId, user);
    }

    @PostMapping("/qa")
    @ResponseStatus(HttpStatus.CREATED)
    public PitchDtos.QaItemDto createQa(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDtos.CreateQaRequest req
    ) {
        return qaService.createQa(roomId, user, req);
    }

    @PutMapping("/qa/{id}")
    public PitchDtos.QaItemDto updateQa(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDtos.UpdateQaRequest req
    ) {
        return qaService.updateQa(roomId, id, user, req);
    }

    @DeleteMapping("/qa/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteQa(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        qaService.deleteQa(roomId, id, user);
    }

    @PatchMapping("/qa/{id}/practiced")
    public PitchDtos.QaItemDto togglePracticed(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) PitchDtos.TogglePracticedRequest req
    ) {
        return qaService.togglePracticed(roomId, id, user, req != null ? req : new PitchDtos.TogglePracticedRequest(null));
    }

    @PostMapping("/qa/generate")
    public PitchDtos.GenerateQaResponse generateQa(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return qaService.generateQa(roomId, user);
    }

    @PostMapping("/qa/code-defense")
    @ResponseStatus(HttpStatus.CREATED)
    public PitchDtos.CodeDefenseDto createCodeDefense(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDtos.CreateCodeDefenseRequest req
    ) {
        return qaService.createCodeDefense(roomId, user, req);
    }

    @DeleteMapping("/qa/code-defense/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCodeDefense(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        qaService.deleteCodeDefense(roomId, id, user);
    }

    @PatchMapping("/qa/code-defense/{id}/practiced")
    public PitchDtos.CodeDefenseDto toggleDefensePracticed(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        return qaService.toggleDefensePracticed(roomId, id, user);
    }
}
