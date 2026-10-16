package com.hackathonos.backend.submission;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.hackathonos.backend.users.User;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for submission draft, checklist, links, verification, and final submission.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/submission")
public class SubmissionController {

    private final SubmissionService submissionService;
    private final com.hackathonos.backend.common.idempotency.IdempotencyService idempotencyService;

    public SubmissionController(SubmissionService submissionService, com.hackathonos.backend.common.idempotency.IdempotencyService idempotencyService) {
        this.submissionService = submissionService;
        this.idempotencyService = idempotencyService;
    }


    @GetMapping
    public SubmissionDtos.SubmissionResponse getSubmission(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return submissionService.getSubmission(roomId, user);
    }

    @PutMapping("/draft")
    public SubmissionDtos.SubmissionDraftDto updateDraft(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody SubmissionDtos.UpdateDraftRequest req
    ) {
        return submissionService.updateDraft(roomId, user, req);
    }

    @PostMapping("/draft/generate")
    public SubmissionDtos.SubmissionDraftDto generateDraft(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) SubmissionDtos.GenerateDraftRequest req
    ) {
        return submissionService.generateDraft(roomId, user, req != null ? req : new SubmissionDtos.GenerateDraftRequest(false));
    }

    @PutMapping("/form-fields")
    public List<SubmissionDtos.FormFieldDto> updateFormFields(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody SubmissionDtos.UpdateFormFieldsRequest req
    ) {
        return submissionService.updateFormFields(roomId, user, req);
    }

    @PatchMapping("/checklist/{key}")
    public SubmissionDtos.ChecklistItemDto toggleChecklist(
            @PathVariable UUID roomId,
            @PathVariable String key,
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) SubmissionDtos.ToggleChecklistRequest req
    ) {
        return submissionService.toggleChecklistItem(roomId, key, user, req != null ? req : new SubmissionDtos.ToggleChecklistRequest(null));
    }

    @PostMapping("/links")
    @ResponseStatus(HttpStatus.CREATED)
    public SubmissionDtos.SubmissionLinkDto addLink(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody SubmissionDtos.CreateLinkRequest req
    ) {
        return submissionService.addLink(roomId, user, req);
    }

    @DeleteMapping("/links/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLink(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        submissionService.deleteLink(roomId, id, user);
    }

    @PostMapping("/links/check")
    public List<SubmissionDtos.SubmissionLinkDto> checkLinks(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return submissionService.checkLinks(roomId, user);
    }

    @PostMapping("/verify")
    public SubmissionDtos.VerifyResultDto verify(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return submissionService.verify(roomId, user);
    }

    @PostMapping({"/mark-submitted", "/submit"})
    public SubmissionDtos.SubmissionResponse markSubmitted(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var cached = idempotencyService.get(user.getId(), idempotencyKey);
            if (cached.isPresent() && cached.get() instanceof SubmissionDtos.SubmissionResponse res) {
                return res;
            }
        }
        SubmissionDtos.SubmissionResponse result = submissionService.markSubmitted(roomId, user);
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            idempotencyService.put(user.getId(), idempotencyKey, result);
        }
        return result;
    }


    @PostMapping("/reopen")
    public SubmissionDtos.SubmissionResponse reopen(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return submissionService.reopen(roomId, user);
    }
}

@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
class RoomSubmitDirectController {

    private final SubmissionService submissionService;

    public RoomSubmitDirectController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping("/submit")
    public SubmissionDtos.SubmissionResponse submitDirect(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return submissionService.markSubmitted(roomId, user);
    }

    @PostMapping({"/submit/reopen", "/reopen"})
    public SubmissionDtos.SubmissionResponse reopenDirect(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return submissionService.reopen(roomId, user);
    }
}
