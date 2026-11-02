package com.hackathonos.backend.ideas;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.ideas.dto.IdeaDto;
import com.hackathonos.backend.ideas.dto.IdeateResponseDto;
import com.hackathonos.backend.ideas.dto.PostIdeaRequest;
import com.hackathonos.backend.ideas.dto.RejectIdeaRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

/**
 * Controller exposing ideation management, decisions, and markdown export endpoints.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
public class IdeasController {

    private final IdeasService ideasService;
    private final CurrentUser currentUser;

    public IdeasController(IdeasService ideasService, CurrentUser currentUser) {
        this.ideasService = ideasService;
        this.currentUser = currentUser;
    }

    @GetMapping("/ideate")
    public IdeateResponseDto getIdeate(@PathVariable UUID roomId) {
        return ideasService.getIdeateData(roomId, currentUser.get());
    }

    @GetMapping("/ideas")
    public ResponseEntity<List<IdeaDto>> listIdeas(
            @PathVariable UUID roomId,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer page
    ) {
        List<IdeaDto> all = ideasService.getIdeateData(roomId, currentUser.get()).ideas();
        int total = all.size();
        int safeLimit = (limit != null && limit > 0) ? Math.min(limit, 500) : 500;
        int pageNum = (page != null && page >= 0) ? page : 0;
        int fromIndex = Math.min(pageNum * safeLimit, total);
        int toIndex = Math.min(fromIndex + safeLimit, total);
        List<IdeaDto> pageItems = all.subList(fromIndex, toIndex);

        var response = ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(total));
        if (total > safeLimit || toIndex < total) {
            response.header("X-Truncated", "true");
        }
        return response.body(pageItems);
    }

    @PostMapping("/ideas")
    public IdeaDto createIdea(
            @PathVariable UUID roomId,
            @RequestBody PostIdeaRequest request) {
        return ideasService.createIdea(roomId, request, currentUser.get());
    }

    @PostMapping("/ideas/{ideaId}/vote")
    public ResponseEntity<java.util.Map<String, Object>> voteIdea(
            @PathVariable UUID roomId,
            @PathVariable UUID ideaId) {
        int count = ideasService.voteIdea(roomId, ideaId, currentUser.get());
        return ResponseEntity.ok(java.util.Map.of("ideaId", ideaId.toString(), "votes", count, "hasVoted", true));
    }

    @DeleteMapping("/ideas/{ideaId}/vote")
    public ResponseEntity<java.util.Map<String, Object>> unvoteIdea(
            @PathVariable UUID roomId,
            @PathVariable UUID ideaId) {
        int count = ideasService.unvoteIdea(roomId, ideaId, currentUser.get());
        return ResponseEntity.ok(java.util.Map.of("ideaId", ideaId.toString(), "votes", count, "hasVoted", false));
    }

    @PatchMapping("/ideas/{ideaId}")
    public IdeaDto updateIdea(
            @PathVariable UUID roomId,
            @PathVariable UUID ideaId,
            @RequestHeader(value = HttpHeaders.IF_MATCH, required = false) String ifMatch,
            @RequestBody PostIdeaRequest request) {
        PostIdeaRequest effRequest = request;
        if (effRequest.baseVersion() == null && ifMatch != null && !ifMatch.isBlank()) {
            try {
                String clean = ifMatch.replace("\"", "").replace("W/", "").trim();
                Long parsed = Long.parseLong(clean);
                effRequest = new PostIdeaRequest(
                        request.text(),
                        request.links(),
                        request.notes(),
                        request.anonymous(),
                        parsed
                );
            } catch (NumberFormatException ignored) {}
        }
        return ideasService.updateIdea(roomId, ideaId, effRequest, currentUser.get());
    }

    private IdeaDto _unused_old_updateIdea(
            UUID roomId,
            UUID ideaId,
            PostIdeaRequest request) {
        return ideasService.updateIdea(roomId, ideaId, request, currentUser.get());
    }

    @DeleteMapping("/ideas/{ideaId}")
    public void deleteIdea(
            @PathVariable UUID roomId,
            @PathVariable UUID ideaId) {
        ideasService.deleteIdea(roomId, ideaId, currentUser.get());
    }

    @PostMapping("/ideas/{ideaId}/approve")
    public IdeaDto approveIdea(
            @PathVariable UUID roomId,
            @PathVariable UUID ideaId) {
        return ideasService.approveIdea(roomId, ideaId, currentUser.get());
    }

    @PostMapping("/ideas/{ideaId}/reject")
    public IdeaDto rejectIdea(
            @PathVariable UUID roomId,
            @PathVariable UUID ideaId,
            @RequestBody(required = false) RejectIdeaRequest request) {
        return ideasService.rejectIdea(roomId, ideaId, request, currentUser.get());
    }

    @PostMapping("/ideas/{ideaId}/restore")
    public IdeaDto restoreIdea(
            @PathVariable UUID roomId,
            @PathVariable UUID ideaId) {
        return ideasService.restoreIdea(roomId, ideaId, currentUser.get());
    }

    @PutMapping("/ideas/{ideaId}/primary")
    public IdeaDto setPrimary(
            @PathVariable UUID roomId,
            @PathVariable UUID ideaId) {
        return ideasService.setPrimaryIdea(roomId, ideaId, currentUser.get());
    }

    @DeleteMapping("/ideas/{ideaId}/primary")
    public IdeaDto clearPrimary(
            @PathVariable UUID roomId,
            @PathVariable UUID ideaId) {
        return ideasService.clearPrimaryIdea(roomId, ideaId, currentUser.get());
    }

    @PostMapping("/ideas/{ideaId}/set-primary")
    public IdeaDto setPrimaryPost(
            @PathVariable UUID roomId,
            @PathVariable UUID ideaId) {
        return ideasService.setPrimaryIdea(roomId, ideaId, currentUser.get());
    }

    @PostMapping({"/ideation/done", "/ideate/done"})
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markIdeationDone(@PathVariable UUID roomId) {
        ideasService.markIdeationDone(roomId, currentUser.get());
    }

    @PostMapping({"/ideation/reopen", "/ideate/reopen"})
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reopenIdeation(@PathVariable UUID roomId) {
        ideasService.reopenIdeation(roomId, currentUser.get());
    }

    @GetMapping("/ideas/export.md")
    public ResponseEntity<byte[]> exportIdeasMarkdown(@PathVariable UUID roomId) {
        String markdown = ideasService.exportIdeasMarkdown(roomId, currentUser.get());
        byte[] bytes = markdown.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ideas.md\"")
                .contentType(MediaType.parseMediaType("text/markdown; charset=UTF-8"))
                .body(bytes);
    }
}
