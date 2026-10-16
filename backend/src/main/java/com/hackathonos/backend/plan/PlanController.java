package com.hackathonos.backend.plan;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.plan.dto.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Controller exposing plan steps, draft saving, validation pipeline, and stage advancing.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
public class PlanController {

    private final PlanService planService;
    private final PlanPromptService planPromptService;
    private final PlanPrepareService planPrepareService;
    private final PlanValidationService planValidationService;
    private final CurrentUser currentUser;

    public PlanController(
            PlanService planService,
            PlanPromptService planPromptService,
            PlanPrepareService planPrepareService,
            PlanValidationService planValidationService,
            CurrentUser currentUser) {
        this.planService = planService;
        this.planPromptService = planPromptService;
        this.planPrepareService = planPrepareService;
        this.planValidationService = planValidationService;
        this.currentUser = currentUser;
    }

    @PostMapping("/plan/steps/{stepNumber}/prepare")
    public StepPrepareResponseDto prepareStep(
            @PathVariable UUID roomId,
            @PathVariable String stepNumber) {
        int n = resolveStepNumber(stepNumber);
        return planPrepareService.prepareStep(roomId, n, currentUser.get());
    }

    @GetMapping("/plan/steps/{stepNumber}/prepare/status")
    public ResponseEntity<PlanPrepareStatusDto> getStepPrepareStatus(
            @PathVariable UUID roomId,
            @PathVariable String stepNumber,
            WebRequest webRequest) {
        int n = resolveStepNumber(stepNumber);
        PlanPrepareStatusDto status = planPrepareService.getStepPrepareStatus(roomId, n, currentUser.get());
        String etag = Integer.toHexString(Objects.hash(status.jobId(), status.status(), status.analysisState(), status.stages().size()));
        if (webRequest.checkNotModified(etag)) {
            return null;
        }
        return ResponseEntity.ok()
                .eTag("\"" + etag + "\"")
                .body(status);
    }

    @PostMapping("/plan/steps/{stepNumber}/prefetch-next")
    public StepPrepareResponseDto prefetchNext(
            @PathVariable UUID roomId,
            @PathVariable String stepNumber) {
        int n = resolveStepNumber(stepNumber);
        return planPrepareService.prefetchNext(roomId, n, currentUser.get());
    }

    @PostMapping("/plan/prepare")
    public PlanPrepareStatusDto preparePlan(@PathVariable UUID roomId) {
        return planPrepareService.preparePlan(roomId, currentUser.get());
    }

    @GetMapping("/plan/prepare/status")
    public PlanPrepareStatusDto getPrepareStatus(@PathVariable UUID roomId) {
        return planPrepareService.getPrepareStatus(roomId, currentUser.get());
    }

    @GetMapping("/plan/steps/{stepNumber}/prompt")
    public PlanPromptResponseDto getStepPrompt(
            @PathVariable UUID roomId,
            @PathVariable String stepNumber) {
        int n = resolveStepNumber(stepNumber);
        return planPromptService.getOrBuildPrompt(roomId, n, currentUser.get(), false);
    }

    @com.hackathonos.backend.common.security.RateLimited(key = "prompt_refresh", limit = 10, periodSeconds = 60)
    @PostMapping("/plan/steps/{stepNumber}/prompt/refresh")
    public PlanPromptResponseDto refreshStepPrompt(
            @PathVariable UUID roomId,
            @PathVariable String stepNumber) {
        int n = resolveStepNumber(stepNumber);
        return planPromptService.getOrBuildPrompt(roomId, n, currentUser.get(), true);
    }

    @PostMapping(value = "/plan/steps/{stepNumber}/validate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ValidatePlanResponse validateStepMultipart(
            @PathVariable UUID roomId,
            @PathVariable String stepNumber,
            @RequestParam(value = "files", required = false) List<MultipartFile> files1,
            @RequestParam(value = "files[]", required = false) List<MultipartFile> files2,
            @RequestParam(value = "file", required = false) List<MultipartFile> files3,
            @RequestParam(value = "confirm", defaultValue = "false") boolean confirm,
            @RequestParam(value = "override", defaultValue = "false") boolean override) {
        List<MultipartFile> allFiles = new ArrayList<>();
        if (files1 != null) allFiles.addAll(files1);
        if (files2 != null) allFiles.addAll(files2);
        if (files3 != null) allFiles.addAll(files3);
        allFiles.removeIf(f -> f == null || f.isEmpty());
        return planValidationService.validateStepMultipart(roomId, stepNumber, allFiles, confirm, override, currentUser.get());
    }

    @PostMapping(value = "/plan/steps/{stepNumber}/validate", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ValidatePlanResponse validateStepJson(
            @PathVariable UUID roomId,
            @PathVariable String stepNumber,
            @RequestBody Map<String, Object> body) {
        String text = (String) body.getOrDefault("text", body.get("answer"));
        boolean confirm = Boolean.TRUE.equals(body.get("confirm")) || Boolean.TRUE.equals(body.get("confirmWarnings"));
        boolean override = Boolean.TRUE.equals(body.get("override")) || Boolean.TRUE.equals(body.get("importAnyway"));
        return planValidationService.validateStepText(roomId, stepNumber, text, confirm, override, currentUser.get());
    }

    @PostMapping("/plan/validate")
    public ValidatePlanResponse validateStep(
            @PathVariable UUID roomId,
            @RequestBody ValidatePlanRequest request) {
        boolean confirm = Boolean.TRUE.equals(request.confirmWarnings());
        return planValidationService.validateStepText(roomId, request.stepKey(), request.answer(), confirm, currentUser.get());
    }

    @GetMapping("/plan")
    public PlanDto getPlan(@PathVariable UUID roomId) {
        return planService.getPlan(roomId, currentUser.get());
    }

    @PostMapping("/plan/start")
    public PlanDto startPlan(@PathVariable UUID roomId) {
        return planService.startPlan(roomId, currentUser.get());
    }

    @PutMapping("/plan/notes")
    public void updatePlanNotes(@PathVariable UUID roomId, @RequestBody PlanNotesRequest request) {
        planService.updatePlanNotes(roomId, request.notes(), currentUser.get());
    }

    @PutMapping("/plan/steps/{stepKey}")
    public void saveStepDraft(
            @PathVariable UUID roomId,
            @PathVariable String stepKey,
            @RequestBody SaveStepRequest request) {
        planService.saveStepDraft(roomId, stepKey, request, currentUser.get());
    }

    @PostMapping("/plan/steps/{stepKey}/generate")
    public GenerateStepResponse generateStep(
            @PathVariable UUID roomId,
            @PathVariable String stepKey) {
        return planService.generateStep(roomId, stepKey, currentUser.get());
    }

    @GetMapping("/plan/context.md")
    public ResponseEntity<byte[]> getContextMarkdown(
            @PathVariable UUID roomId,
            @RequestParam(name = "step", defaultValue = "prd") String stepKey) {
        String markdown = planService.getContextMarkdown(roomId, stepKey, currentUser.get());
        byte[] bytes = markdown.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"context.md\"")
                .contentType(MediaType.parseMediaType("text/markdown; charset=UTF-8"))
                .body(bytes);
    }

    @PostMapping("/stage/enter-build")
    public void enterBuild(@PathVariable UUID roomId) {
        planService.enterBuild(roomId, currentUser.get());
    }

    @PostMapping("/stage/unlock-build")
    public void unlockBuild(@PathVariable UUID roomId) {
        planService.unlockBuild(roomId, currentUser.get());
    }

    private int resolveStepNumber(String stepNumber) {
        if (stepNumber == null || stepNumber.isBlank()) return 1;
        String s = stepNumber.trim().toLowerCase();
        if (Character.isDigit(s.charAt(0))) {
            try {
                int n = Integer.parseInt(s);
                if (n >= 1 && n <= 4) return n;
                if (n == 5) return 4;
            } catch (Exception ignored) {}
        }
        String normalized = PlanPromptService.normalizeStepKey(s);
        int idx = PlanPromptService.STEP_KEYS.indexOf(normalized);
        return idx >= 0 ? idx + 1 : 1;
    }
}
