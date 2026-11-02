package com.hackathonos.backend.mcp;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.mcp.dto.McpBriefResponse;
import com.hackathonos.backend.mcp.dto.McpRoomDto;
import com.hackathonos.backend.mcp.dto.McpStepDto;
import com.hackathonos.backend.mcp.dto.McpSubmitRequest;
import com.hackathonos.backend.mcp.dto.McpSubmitResponse;
import com.hackathonos.backend.users.User;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/mcp")
public class McpController {

    private final McpService mcpService;
    private final CurrentUser currentUser;

    public McpController(McpService mcpService, CurrentUser currentUser) {
        this.mcpService = mcpService;
        this.currentUser = currentUser;
    }

    @GetMapping("/me")
    public com.hackathonos.backend.mcp.dto.McpMeResponse getMe() {
        User user = currentUser.get();
        return mcpService.getMe(user);
    }

    @GetMapping("/rooms")
    public List<McpRoomDto> listRooms() {
        User user = currentUser.get();
        return mcpService.listRooms(user);
    }

    @GetMapping("/rooms/{roomId}/steps")
    public List<McpStepDto> getSteps(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return mcpService.getSteps(roomId, user);
    }

    @GetMapping("/rooms/{roomId}/steps/{step}/brief")
    public McpBriefResponse getStepBrief(
            @PathVariable UUID roomId,
            @PathVariable String step
    ) {
        User user = currentUser.get();
        return mcpService.getStepBrief(roomId, step, user);
    }

    @PostMapping("/rooms/{roomId}/steps/{step}/submit")
    public McpSubmitResponse submitStep(
            @PathVariable UUID roomId,
            @PathVariable String step,
            @Valid @RequestBody McpSubmitRequest request
    ) {
        User user = currentUser.get();
        return mcpService.submitStep(roomId, step, request, user);
    }
}
