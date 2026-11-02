package com.hackathonos.backend.dev;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@Profile("dev")
@RequestMapping("/api/v1/dev")
public class DevController {

    private final DevService devService;
    private final DemoRoomSeeder demoRoomSeeder;
    private final CurrentUser currentUser;
    private final com.hackathonos.backend.mcp.McpTokenService mcpTokenService;

    public DevController(DevService devService,
                         DemoRoomSeeder demoRoomSeeder,
                         CurrentUser currentUser,
                         com.hackathonos.backend.mcp.McpTokenService mcpTokenService) {
        this.devService = devService;
        this.demoRoomSeeder = demoRoomSeeder;
        this.currentUser = currentUser;
        this.mcpTokenService = mcpTokenService;
    }

    @PostMapping("/demo-room")
    public Map<String, Object> seedDemoRoom() {
        User user = currentUser.get();
        return demoRoomSeeder.seedDemoRoom(user);
    }

    @PostMapping("/rooms/{roomId}/fake-members")
    public Map<String, Object> addFakeMembers(@PathVariable UUID roomId,
                                              @RequestBody(required = false) FakeMembersRequest request) {
        User user = currentUser.get();
        return devService.addFakeMembers(user, roomId, request);
    }

    @PostMapping("/rooms/{roomId}/seed-ideas")
    public Map<String, Object> seedIdeas(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return devService.seedIdeas(user, roomId);
    }

    public record SetClockRequest(Integer hourOfEvent) {}

    @PostMapping("/rooms/{roomId}/set-clock")
    public Map<String, Object> setClock(@PathVariable UUID roomId,
                                        @RequestBody SetClockRequest request) {
        User user = currentUser.get();
        int hour = request != null && request.hourOfEvent() != null ? request.hourOfEvent() : 39;
        return devService.setClock(user, roomId, hour);
    }

    public record SimulateProgressRequest(Integer percent) {}

    @PostMapping("/rooms/{roomId}/simulate-progress")
    public Map<String, Object> simulateProgress(@PathVariable UUID roomId,
                                                @RequestBody SimulateProgressRequest request) {
        User user = currentUser.get();
        int pct = request != null && request.percent() != null ? request.percent() : 60;
        return devService.simulateProgress(user, roomId, pct);
    }

    public record AddCommitsRequest(String branch, Integer count, Boolean beforeKickoff) {}

    @PostMapping("/rooms/{roomId}/github/add-commits")
    public Map<String, Object> addCommits(@PathVariable UUID roomId,
                                          @RequestBody(required = false) AddCommitsRequest request) {
        User user = currentUser.get();
        String branch = request != null ? request.branch() : "main";
        Integer count = request != null ? request.count() : 3;
        Boolean beforeKickoff = request != null && Boolean.TRUE.equals(request.beforeKickoff());
        return devService.addCommits(user, roomId, branch, count, beforeKickoff);
    }

    @PostMapping("/rooms/{roomId}/seed-present")
    public Map<String, Object> seedPresent(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return devService.seedPresent(user, roomId);
    }

    public record DevMcpTokenResponse(String token, String tokenType, String scope, java.time.Instant expiresAt) {}

    @PostMapping("/mcp-token")
    public DevMcpTokenResponse createDevMcpToken() {
        User user = currentUser.get();
        var gen = mcpTokenService.createAccessToken(
                user.getId(),
                java.time.Duration.ofHours(24),
                "dev-client",
                "mcp"
        );
        return new DevMcpTokenResponse(
                gen.rawToken(),
                "Bearer",
                gen.tokenEntity().getScope(),
                gen.tokenEntity().getExpiresAt()
        );
    }
}

