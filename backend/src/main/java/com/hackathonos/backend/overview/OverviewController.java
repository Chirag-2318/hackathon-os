package com.hackathonos.backend.overview;

import com.hackathonos.backend.overview.dto.OverviewDtos.NavBadgesDto;
import com.hackathonos.backend.users.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
public class OverviewController {

    private final OverviewService overviewService;

    public OverviewController(OverviewService overviewService) {
        this.overviewService = overviewService;
    }

    @GetMapping("/overview")
    public Object getOverview(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return overviewService.getOverview(roomId, user);
    }

    @GetMapping("/progress")
    public ProgressService.ProgressResultDto getProgress(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return overviewService.getProgress(roomId, user);
    }

    @GetMapping("/workload")
    public WorkloadService.WorkloadResponseDto getWorkload(
            @PathVariable UUID roomId,
            @RequestParam(defaultValue = "phase") String scope,
            @AuthenticationPrincipal User user
    ) {
        return overviewService.getWorkload(roomId, scope, user);
    }

    @GetMapping("/nav-badges")
    public NavBadgesDto getNavBadges(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return overviewService.getNavBadges(roomId, user);
    }
}
