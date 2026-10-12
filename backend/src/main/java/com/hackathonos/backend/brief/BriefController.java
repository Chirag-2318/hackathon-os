package com.hackathonos.backend.brief;

import com.hackathonos.backend.brief.dto.*;
import com.hackathonos.backend.common.security.CurrentUser;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Controller exposing brief management, source parsing, and confirmation endpoints.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/brief")
public class BriefController {

    private final BriefService briefService;
    private final CurrentUser currentUser;

    public BriefController(BriefService briefService, CurrentUser currentUser) {
        this.briefService = briefService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public BriefResponseDto getBrief(@PathVariable UUID roomId) {
        return briefService.getBrief(roomId, currentUser.get());
    }

    @PutMapping
    public BriefResponseDto saveBrief(@PathVariable UUID roomId, @RequestBody SaveBriefRequest request) {
        return briefService.saveBrief(roomId, request, currentUser.get());
    }

    @PatchMapping("/confirmed-fields")
    public BriefResponseDto updateConfirmedField(
            @PathVariable UUID roomId,
            @RequestBody ConfirmedFieldRequest request) {
        return briefService.updateConfirmedField(roomId, request, currentUser.get());
    }

    @PostMapping("/source/link")
    public BriefResponseDto setLinkSource(
            @PathVariable UUID roomId,
            @RequestBody LinkSourceRequest request) {
        return briefService.setLinkSource(roomId, request.url(), currentUser.get());
    }

    @PostMapping(value = "/source/pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BriefResponseDto setPdfSource(
            @PathVariable UUID roomId,
            @RequestParam("file") MultipartFile file) {
        return briefService.setPdfSource(roomId, file, currentUser.get());
    }

    @PostMapping(value = "/source/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BriefResponseDto setImagesSource(
            @PathVariable UUID roomId,
            @RequestParam("files") java.util.List<MultipartFile> files) {
        return briefService.setImagesSource(roomId, files, currentUser.get());
    }

    @PostMapping("/source/text")
    public BriefResponseDto setTextSource(
            @PathVariable UUID roomId,
            @jakarta.validation.Valid @RequestBody TextSourceRequest request) {
        return briefService.setTextSource(roomId, request.text(), currentUser.get());
    }

    @GetMapping("/extraction-prompt")
    public ExtractionPromptResponse getExtractionPrompt(@PathVariable UUID roomId) {
        return briefService.getExtractionPrompt(roomId, currentUser.get());
    }

    @PostMapping("/extract/validate")
    public ValidateExtractResponse validateExtract(
            @PathVariable UUID roomId,
            @RequestBody ValidateExtractRequest request) {
        return briefService.validateExtractedJson(roomId, request.jsonText(), currentUser.get());
    }

    @PostMapping("/extract/auto")
    public ValidateExtractResponse autoExtract(@PathVariable UUID roomId) {
        return briefService.autoExtract(roomId, currentUser.get());
    }

    @PostMapping("/confirm")
    public BriefResponseDto confirmBrief(
            @PathVariable UUID roomId,
            @RequestBody(required = false) ConfirmBriefRequest request) {
        return briefService.confirmBrief(roomId, request, currentUser.get());
    }

    @DeleteMapping
    public void deleteBrief(@PathVariable UUID roomId) {
        briefService.deleteBrief(roomId, currentUser.get());
    }
}
