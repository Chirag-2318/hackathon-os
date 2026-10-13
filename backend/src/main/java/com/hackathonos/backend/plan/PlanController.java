package com.hackathonos.backend.plan;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.plan.dto.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Controller exposing plan steps, draft saving, validation pipeline, and stage advancing.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
public class PlanController {

    private final PlanService planService;
    private final PlanPromptService planPromptService;
    private final CurrentUser currentUser;

    public PlanController(PlanService planService, PlanPromptService planPromptService, CurrentUser currentUser) {
        this.planService = planService;
        this.planPromptService = planPromptService;
        this.currentUser = currentUser;
    }

    @GetMapping("/plan/steps/{stepNumber}/prompt")
    public PlanPromptResponseDto getStepPrompt(
            @PathVariable UUID roomId,
            @PathVariable int stepNumber) {
        return planPromptService.getOrBuildPrompt(roomId, stepNumber, currentUser.get(), false);
    }

    @com.hackathonos.backend.common.security.RateLimited(key = "prompt_refresh", limit = 10, periodSeconds = 60)
    @PostMapping("/plan/steps/{stepNumber}/prompt/refresh")
    public PlanPromptResponseDto refreshStepPrompt(
            @PathVariable UUID roomId,
            @PathVariable int stepNumber) {
        return planPromptService.getOrBuildPrompt(roomId, stepNumber, currentUser.get(), true);
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

    @PostMapping("/plan/validate")
    public ValidatePlanResponse validateStep(
            @PathVariable UUID roomId,
            @RequestBody ValidatePlanRequest request) {
        return planService.validateStep(roomId, request, currentUser.get());
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
}
