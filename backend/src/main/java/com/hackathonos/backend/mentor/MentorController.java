package com.hackathonos.backend.mentor;

import com.hackathonos.backend.users.User;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for room members to manage mentor links and answer questions.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
public class MentorController {

    private final MentorService mentorService;

    public MentorController(MentorService mentorService) {
        this.mentorService = mentorService;
    }

    @PostMapping("/mentor-links")
    @ResponseStatus(HttpStatus.CREATED)
    public MentorDtos.MentorLinkDto createLink(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) MentorDtos.CreateMentorLinkRequest req
    ) {
        return mentorService.createLink(roomId, user, req != null ? req : new MentorDtos.CreateMentorLinkRequest(3));
    }

    @GetMapping("/mentor-links")
    public List<MentorDtos.MentorLinkDto> listLinks(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return mentorService.listLinks(roomId, user);
    }

    @DeleteMapping("/mentor-links/{linkId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeLink(
            @PathVariable UUID roomId,
            @PathVariable UUID linkId,
            @AuthenticationPrincipal User user
    ) {
        mentorService.revokeLink(roomId, linkId, user);
    }

    @GetMapping("/mentor-questions")
    public List<MentorDtos.MentorQuestionDto> listQuestions(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return mentorService.listQuestions(roomId, user);
    }

    @PatchMapping("/mentor-questions/{id}")
    public MentorDtos.MentorQuestionDto answerQuestion(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody MentorDtos.AnswerQuestionRequest req
    ) {
        return mentorService.answerQuestion(roomId, id, user, req);
    }
}
