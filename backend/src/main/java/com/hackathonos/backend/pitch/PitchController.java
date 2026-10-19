package com.hackathonos.backend.pitch;

import com.hackathonos.backend.users.User;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Controller for Pitch Deck, Rehearsals, Q&A defense, Deck Sources, and Pitch Scripts.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/pitch")
public class PitchController {

    private final PitchDeckService deckService;
    private final PitchDeckSourceService deckSourceService;
    private final PitchScriptService scriptService;
    private final PitchRehearsalService rehearsalService;
    private final PitchQaService qaService;
    private final PitchDocService pitchDocService;

    public PitchController(
            PitchDeckService deckService,
            PitchDeckSourceService deckSourceService,
            PitchScriptService scriptService,
            PitchRehearsalService rehearsalService,
            PitchQaService qaService,
            PitchDocService pitchDocService
    ) {
        this.deckService = deckService;
        this.deckSourceService = deckSourceService;
        this.scriptService = scriptService;
        this.rehearsalService = rehearsalService;
        this.qaService = qaService;
        this.pitchDocService = pitchDocService;
    }

    // ── DECK SOURCE ──────────────────────────────────────────────────

    @GetMapping("/deck/source")
    public PitchDtos.PitchDeckSourceDto getDeckSource(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return deckSourceService.getSource(roomId, user);
    }

    @PutMapping("/deck/source")
    public PitchDtos.PitchDeckSourceDto saveDeckSource(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDtos.SaveDeckSourceRequest req
    ) {
        return deckSourceService.saveSource(roomId, user, req);
    }

    @DeleteMapping("/deck/source")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDeckSource(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        deckSourceService.deleteSource(roomId, user);
    }

    @PostMapping(value = "/deck/source/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PitchDtos.PitchDeckSourceDto uploadDeckFile(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        return deckSourceService.uploadFile(roomId, user, file);
    }

    @GetMapping("/deck/source/file")
    public ResponseEntity<Resource> getDeckFile(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return deckSourceService.streamFile(roomId, user);
    }

    // ── PITCH SCRIPT ─────────────────────────────────────────────────

    @PostMapping("/generate")
    public PitchDtos.PitchScriptDto generatePitchScript(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDtos.GeneratePitchScriptRequest req
    ) {
        return scriptService.generateScript(roomId, user, req);
    }

    @GetMapping("/script")
    public PitchDtos.PitchScriptDto getPitchScript(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return scriptService.getScript(roomId, user);
    }

    @PutMapping("/script/slides/{n}")
    public PitchDtos.PitchScriptDto updatePitchSlide(
            @PathVariable UUID roomId,
            @PathVariable int n,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDtos.UpdatePitchSlidePlanRequest req
    ) {
        return scriptService.updateSlidePlan(roomId, n, user, req);
    }

    @DeleteMapping("/script")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePitchScript(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        scriptService.deleteScript(roomId, user);
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

    @PostMapping({"/rehearse", "/rehearse/runs"})
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
    public List<PitchDtos.QaItemDto> generateQa(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) PitchDtos.GenerateQaRequest req
    ) {
        return qaService.generateQa(roomId, user, req);
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

    // ── PITCH & Q&A FROM DOCS ────────────────────────────────────────

    @GetMapping("/doc-status")
    public PitchDocDtos.PitchDocStatusDto getDocStatus(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return pitchDocService.getDocStatus(roomId, user);
    }

    @PostMapping("/from-doc")
    public PitchDtos.PitchScriptDto useDemoScript(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return pitchDocService.useDemoScript(roomId, user);
    }

    @GetMapping("/qna-doc")
    public PitchDocDtos.QnaDocResponseDto getQnaDoc(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return pitchDocService.getQnaDoc(roomId, user);
    }

    @PostMapping("/qna-practice")
    public ResponseEntity<Void> toggleQnaPractice(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PitchDocDtos.ToggleQnaPracticeRequest req
    ) {
        pitchDocService.togglePractice(roomId, user, req.questionHash(), req.practiced());
        return ResponseEntity.ok().build();
    }
}
