package com.hackathonos.backend.team;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.team.dto.TeamDtos.SaveCharterRequest;
import com.hackathonos.backend.team.dto.TeamDtos.TeamResponseDto;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/team")
public class TeamController {

    private final TeamService teamService;
    private final CurrentUser currentUser;

    public TeamController(TeamService teamService, CurrentUser currentUser) {
        this.teamService = teamService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public TeamResponseDto getTeam(@PathVariable UUID roomId) {
        return teamService.getTeam(roomId, currentUser.get());
    }

    @PutMapping("/charter")
    public TeamResponseDto saveCharter(@PathVariable UUID roomId, @RequestBody SaveCharterRequest request) {
        return teamService.saveCharter(roomId, currentUser.get(), request);
    }
}
