package com.hackathonos.backend.overview;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.overview.dto.OverviewDtos.NavBadgesDto;
import com.hackathonos.backend.users.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
public class OverviewController {

    private final OverviewService overviewService;
    private final CurrentUser currentUser;

    public OverviewController(OverviewService overviewService, CurrentUser currentUser) {
        this.overviewService = overviewService;
        this.currentUser = currentUser;
    }

    @GetMapping("/overview")
    public Object getOverview(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        User resolved = user != null ? user : currentUser.get();
        return overviewService.getOverview(roomId, resolved);
    }

    @GetMapping("/progress")
    public ProgressService.ProgressResultDto getProgress(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        User resolved = user != null ? user : currentUser.get();
        return overviewService.getProgress(roomId, resolved);
    }

    @GetMapping("/workload")
    public WorkloadService.WorkloadResponseDto getWorkload(
            @PathVariable UUID roomId,
            @RequestParam(defaultValue = "phase") String scope,
            @AuthenticationPrincipal User user
    ) {
        User resolved = user != null ? user : currentUser.get();
        return overviewService.getWorkload(roomId, scope, resolved);
    }

    @GetMapping("/nav-badges")
    public NavBadgesDto getNavBadges(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        User resolved = user != null ? user : currentUser.get();
        return overviewService.getNavBadges(roomId, resolved);
    }
}
