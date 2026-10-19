package com.hackathonos.backend.phases;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.phases.dto.DropTaskRequestDto;
import com.hackathonos.backend.phases.dto.PhaseAdvanceRequestDto;
import com.hackathonos.backend.phases.dto.PhaseAdvanceResponseDto;
import com.hackathonos.backend.phases.dto.PhaseSummaryDto;
import com.hackathonos.backend.phases.dto.PhaseTaskImportSummaryDto;
import com.hackathonos.backend.phases.dto.PhaseTaskPromptResponseDto;
import com.hackathonos.backend.phases.dto.*;
import com.hackathonos.backend.tasks.Task;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/rooms/{roomId}", "/rooms/{roomId}"})
public class PhaseController {

    private final PhaseService phaseService;
    private final CurrentUser currentUser;

    public PhaseController(PhaseService phaseService, CurrentUser currentUser) {
        this.phaseService = phaseService;
        this.currentUser = currentUser;
    }

    @GetMapping("/phases")
    public List<PhaseSummaryDto> getPhases(@PathVariable UUID roomId) {
        return phaseService.getPhases(roomId, currentUser.get());
    }

    @PostMapping("/phases/{phaseKey}/advance")
    public PhaseAdvanceResponseDto advancePhase(
            @PathVariable UUID roomId,
            @PathVariable String phaseKey,
            @RequestBody(required = false) PhaseAdvanceRequestDto request) {
        return phaseService.advancePhase(roomId, phaseKey, request, currentUser.get());
    }

    @PostMapping("/tasks/{taskId}/defer")
    public Task deferTask(@PathVariable UUID roomId, @PathVariable UUID taskId) {
        return phaseService.deferTask(roomId, taskId, currentUser.get());
    }

    @PostMapping("/tasks/{taskId}/drop")
    public Task dropTask(
            @PathVariable UUID roomId,
            @PathVariable UUID taskId,
            @RequestBody(required = false) DropTaskRequestDto request) {
        return phaseService.dropTask(roomId, taskId, request != null ? request.reason() : null, currentUser.get());
    }

    @PostMapping("/phases/{phaseKey}/dismiss-ready")
    public void dismissReady(@PathVariable UUID roomId, @PathVariable String phaseKey) {
        phaseService.dismissPhaseReady(roomId, phaseKey, currentUser.get());
    }

    @GetMapping("/phases/{phaseKey}/tasks/prompt")
    public PhaseTaskPromptResponseDto getPhaseTaskPrompt(
            @PathVariable UUID roomId,
            @PathVariable String phaseKey,
            @RequestParam(name = "mode", defaultValue = "FRESH") String mode) {
        return phaseService.buildPhaseTaskPrompt(roomId, phaseKey, mode, currentUser.get());
    }

    @GetMapping("/context-pack.md")
    public ResponseEntity<byte[]> getContextPack(@PathVariable UUID roomId) {
        byte[] bytes = phaseService.buildProjectContextPack(roomId, currentUser.get());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"project-context.md\"")
                .contentType(MediaType.parseMediaType("text/markdown; charset=UTF-8"))
                .body(bytes);
    }

    @PostMapping(value = "/phases/{phaseKey}/tasks/validate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PhaseTaskImportSummaryDto validateAndImportTasks(
            @PathVariable UUID roomId,
            @PathVariable String phaseKey,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @RequestParam(value = "files[]", required = false) MultipartFile[] filesBracket,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(name = "mode", defaultValue = "FRESH") String mode,
            @RequestParam(name = "confirmRegenerate", defaultValue = "false") boolean confirmRegenerate) {
        MultipartFile[] effectiveFiles = files;
        if ((effectiveFiles == null || effectiveFiles.length == 0) && filesBracket != null && filesBracket.length > 0) {
            effectiveFiles = filesBracket;
        }
        if ((effectiveFiles == null || effectiveFiles.length == 0) && file != null) {
            effectiveFiles = new MultipartFile[]{file};
        }
        return phaseService.validateAndImportTasks(roomId, phaseKey, effectiveFiles, mode, confirmRegenerate, currentUser.get());
    }

    @PostMapping("/phases/{phaseKey}/tasks/generate")
    public Map<String, String> generateTasks(
            @PathVariable UUID roomId,
            @PathVariable String phaseKey) {
        String answer = phaseService.generatePhaseTasks(roomId, phaseKey, currentUser.get());
        return Map.of("content", answer);
    }
}
