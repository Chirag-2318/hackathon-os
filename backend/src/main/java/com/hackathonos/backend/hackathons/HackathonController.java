package com.hackathonos.backend.hackathons;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.common.security.RateLimited;
import com.hackathonos.backend.hackathons.dto.HackathonDtos.HackathonLiveResponseDto;
import com.hackathonos.backend.hackathons.dto.HackathonDtos.HackathonSuggestionRequest;
import com.hackathonos.backend.users.User;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;

import java.time.Duration;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/hackathons")
public class HackathonController {

    private final HackathonService hackathonService;
    private final CurrentUser currentUser;

    public HackathonController(HackathonService hackathonService, CurrentUser currentUser) {
        this.hackathonService = hackathonService;
        this.currentUser = currentUser;
    }

    @GetMapping("/live")
    @RateLimited(key = "hackathons_live", limit = 60, periodSeconds = 60)
    public ResponseEntity<HackathonLiveResponseDto> getLiveHackathons(
            @RequestParam(defaultValue = "6") int limit,
            WebRequest webRequest
    ) {
        HackathonLiveResponseDto response = hackathonService.getLiveHackathons(limit);

        // Generate ETag based on item IDs, titles and endsAt
        int hash = response.items().stream()
                .mapToInt(i -> Objects.hash(i.id(), i.endsAt()))
                .reduce(1, (a, b) -> 31 * a + b);
        String eTag = "\"" + Integer.toHexString(hash) + "\"";

        if (webRequest.checkNotModified(eTag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).build();
        }

        return ResponseEntity.ok()
                .eTag(eTag)
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic())
                .body(response);
    }

    @PostMapping("/suggestions")
    @RateLimited(key = "hackathon_suggest", limit = 5, periodSeconds = 86400)
    public ResponseEntity<Void> submitSuggestion(@RequestBody HackathonSuggestionRequest request) {
        User user = currentUser.get();
        hackathonService.submitSuggestion(user.getId(), request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }
}
