package com.hackathonos.backend.mentor;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Public controller for mentors accessing read-only context snapshots and asking questions.
 */
@RestController
@RequestMapping("/api/v1/mentor")
public class PublicMentorController {

    private final MentorService mentorService;
    private final com.hackathonos.backend.common.security.ClientIpResolver clientIpResolver;

    public PublicMentorController(MentorService mentorService, com.hackathonos.backend.common.security.ClientIpResolver clientIpResolver) {
        this.mentorService = mentorService;
        this.clientIpResolver = clientIpResolver;
    }

    @GetMapping("/{token}/context")
    public MentorDtos.MentorContextResponse getPublicContext(
            @PathVariable String token
    ) {
        return mentorService.getPublicContext(token);
    }

    @PostMapping("/{token}/ask")
    @ResponseStatus(HttpStatus.CREATED)
    public void submitQuestion(
            @PathVariable String token,
            @RequestBody MentorDtos.PublicAskRequest req,
            HttpServletRequest request
    ) {
        String clientIp = clientIpResolver.resolveClientIp(request);
        mentorService.submitPublicQuestion(token, clientIp, req);
    }
}
