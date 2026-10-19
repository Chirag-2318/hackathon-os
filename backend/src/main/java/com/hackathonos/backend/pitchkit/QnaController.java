package com.hackathonos.backend.pitchkit;

import com.hackathonos.backend.pitchkit.QnaDtos.*;
import com.hackathonos.backend.users.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class QnaController {

    private final QnaService qnaService;

    public QnaController(QnaService qnaService) {
        this.qnaService = qnaService;
    }

    @GetMapping({"/api/v1/rooms/{roomId}/qna", "/rooms/{roomId}/qna"})
    public List<QnaItemDto> getItems(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return qnaService.getItems(roomId, user);
    }

    @GetMapping({"/api/v1/rooms/{roomId}/qna/map", "/rooms/{roomId}/qna/map"})
    public QnaMapResponse getMap(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return qnaService.getMap(roomId, user);
    }

    @PutMapping({"/api/v1/rooms/{roomId}/qna/{hash}/mine", "/rooms/{roomId}/qna/{hash}/mine"})
    public void updateMyAnswer(
            @PathVariable UUID roomId,
            @PathVariable String hash,
            @RequestBody UpdateMyAnswerRequest req,
            @AuthenticationPrincipal User user
    ) {
        qnaService.updateMyAnswer(roomId, hash, req, user);
    }

    @PutMapping({"/api/v1/rooms/{roomId}/qna/{hash}/mastery", "/rooms/{roomId}/qna/{hash}/mastery"})
    public void updateMastery(
            @PathVariable UUID roomId,
            @PathVariable String hash,
            @RequestBody UpdateMasteryRequest req,
            @AuthenticationPrincipal User user
    ) {
        qnaService.updateMastery(roomId, hash, req.level(), user);
    }

    @PostMapping({"/api/v1/rooms/{roomId}/qna/items", "/rooms/{roomId}/qna/items"})
    public QnaItemDto createCustomItem(
            @PathVariable UUID roomId,
            @RequestBody CreateCustomQuestionRequest req,
            @AuthenticationPrincipal User user
    ) {
        return qnaService.createCustomItem(roomId, req, user);
    }

    @PatchMapping({"/api/v1/rooms/{roomId}/qna/items/{itemId}", "/rooms/{roomId}/qna/items/{itemId}"})
    public QnaItemDto patchCustomItem(
            @PathVariable UUID roomId,
            @PathVariable UUID itemId,
            @RequestBody PatchCustomQuestionRequest req,
            @AuthenticationPrincipal User user
    ) {
        return qnaService.patchCustomItem(roomId, itemId, req, user);
    }

    @DeleteMapping({"/api/v1/rooms/{roomId}/qna/items/{itemId}", "/rooms/{roomId}/qna/items/{itemId}"})
    public void deleteCustomItem(
            @PathVariable UUID roomId,
            @PathVariable UUID itemId,
            @AuthenticationPrincipal User user
    ) {
        qnaService.deleteCustomItem(roomId, itemId, user);
    }

    @PostMapping({"/api/v1/rooms/{roomId}/qna/sessions", "/rooms/{roomId}/qna/sessions"})
    public StartSessionResponse startSession(
            @PathVariable UUID roomId,
            @RequestBody StartSessionRequest req,
            @AuthenticationPrincipal User user
    ) {
        return qnaService.startSession(roomId, req, user);
    }

    @PostMapping({
            "/api/v1/rooms/{roomId}/qna/sessions/{sessionId}/answers",
            "/rooms/{roomId}/qna/sessions/{sessionId}/answers",
            "/api/v1/qna/sessions/{sessionId}/answers",
            "/qna/sessions/{sessionId}/answers"
    })
    public void submitSessionAnswer(
            @PathVariable(required = false) UUID roomId,
            @PathVariable UUID sessionId,
            @RequestBody SubmitSessionAnswerRequest req,
            @AuthenticationPrincipal User user
    ) {
        qnaService.submitSessionAnswer(roomId, sessionId, req, user);
    }

    @PostMapping({
            "/api/v1/rooms/{roomId}/qna/sessions/{sessionId}/audio",
            "/rooms/{roomId}/qna/sessions/{sessionId}/audio",
            "/api/v1/qna/sessions/{sessionId}/audio",
            "/qna/sessions/{sessionId}/audio"
    })
    public Map<String, String> uploadSessionAudio(
            @PathVariable(required = false) UUID roomId,
            @PathVariable UUID sessionId,
            @RequestParam("hash") String hash,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        return qnaService.uploadSessionAudio(roomId, sessionId, hash, file, user);
    }

    @PostMapping({
            "/api/v1/rooms/{roomId}/qna/sessions/{sessionId}/finish",
            "/rooms/{roomId}/qna/sessions/{sessionId}/finish",
            "/api/v1/qna/sessions/{sessionId}/finish",
            "/qna/sessions/{sessionId}/finish"
    })
    public SessionSummaryDto finishSession(
            @PathVariable(required = false) UUID roomId,
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal User user
    ) {
        return qnaService.finishSession(roomId, sessionId, user);
    }

    @PostMapping({"/api/v1/rooms/{roomId}/qna/grade", "/rooms/{roomId}/qna/grade"})
    public AiGradeResponse gradeAnswer(
            @PathVariable UUID roomId,
            @RequestBody AiGradeRequest req,
            @AuthenticationPrincipal User user
    ) {
        return qnaService.gradeAnswer(roomId, req, user);
    }

    @PostMapping({"/api/v1/rooms/{roomId}/qna/more", "/rooms/{roomId}/qna/more"})
    public List<QnaItemDto> generateMore(
            @PathVariable UUID roomId,
            @RequestBody AiGenerateMoreRequest req,
            @AuthenticationPrincipal User user
    ) {
        return qnaService.generateMore(roomId, req, user);
    }
}
