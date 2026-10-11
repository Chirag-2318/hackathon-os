package com.hackathonos.backend.crowdcheck;

import com.hackathonos.backend.users.User;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller for competitor analysis and crowd checks.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/crowd-check")
public class CrowdCheckController {

    private final CrowdCheckService crowdCheckService;

    public CrowdCheckController(CrowdCheckService crowdCheckService) {
        this.crowdCheckService = crowdCheckService;
    }

    @GetMapping
    public CrowdCheckDtos.CrowdCheckResponse getCrowdCheck(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return crowdCheckService.getCrowdCheck(roomId, user);
    }

    @PostMapping("/rows")
    @ResponseStatus(HttpStatus.CREATED)
    public CrowdCheckDtos.CrowdRowDto createRow(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody CrowdCheckDtos.CreateCrowdRowRequest req
    ) {
        return crowdCheckService.createRow(roomId, user, req);
    }

    @PatchMapping("/rows/{rowId}")
    public CrowdCheckDtos.CrowdRowDto updateRow(
            @PathVariable UUID roomId,
            @PathVariable UUID rowId,
            @AuthenticationPrincipal User user,
            @RequestBody CrowdCheckDtos.UpdateCrowdRowRequest req
    ) {
        return crowdCheckService.updateRow(roomId, rowId, user, req);
    }

    @DeleteMapping("/rows/{rowId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRow(
            @PathVariable UUID roomId,
            @PathVariable UUID rowId,
            @AuthenticationPrincipal User user
    ) {
        crowdCheckService.deleteRow(roomId, rowId, user);
    }
}
