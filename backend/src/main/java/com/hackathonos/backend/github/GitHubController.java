package com.hackathonos.backend.github;

import com.hackathonos.backend.github.dto.GithubDtos.*;
import com.hackathonos.backend.users.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class GitHubController {

    private final GitHubService gitHubService;

    public GitHubController(GitHubService gitHubService) {
        this.gitHubService = gitHubService;
    }

    @GetMapping("/api/v1/rooms/{roomId}/github")
    public GithubPageResponse getPage(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.getPage(roomId, user);
    }

    @PostMapping("/api/v1/rooms/{roomId}/github/connect")
    public GithubPageResponse connect(
            @PathVariable UUID roomId,
            @RequestBody ConnectRepoRequest request,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.connect(roomId, request, user);
    }

    @DeleteMapping("/api/v1/rooms/{roomId}/github/connect")
    public ResponseEntity<Void> disconnect(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        gitHubService.disconnect(roomId, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/rooms/{roomId}/github/sync")
    public GithubPageResponse sync(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.sync(roomId, user);
    }

    @PatchMapping("/api/v1/rooms/{roomId}/github/branches/{branchId}")
    public BranchDto updateBranch(
            @PathVariable UUID roomId,
            @PathVariable UUID branchId,
            @RequestBody UpdateBranchRequest request,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.updateBranch(roomId, branchId, request, user);
    }

    @PutMapping("/api/v1/rooms/{roomId}/github/branches/{branchId}/tasks")
    public BranchDto linkBranchTasks(
            @PathVariable UUID roomId,
            @PathVariable UUID branchId,
            @RequestBody LinkBranchTasksRequest request,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.linkBranchTasks(roomId, branchId, request, user);
    }

    @PutMapping("/api/v1/rooms/{roomId}/github/deployed-link")
    public DeployedLinkResponse updateDeployedLink(
            @PathVariable UUID roomId,
            @RequestBody DeployedLinkRequest request,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.updateDeployedLink(roomId, request, user);
    }

    @PostMapping("/api/v1/rooms/{roomId}/github/freeze")
    public FreezeResponse freezeDemo(
            @PathVariable UUID roomId,
            @RequestBody FreezeRequest request,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.freezeDemo(roomId, request, user);
    }

    @GetMapping("/api/v1/rooms/{roomId}/github/freeze")
    public FreezeChecklistResponse getFreezeChecklist(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.getFreezeChecklist(roomId, user);
    }

    @PostMapping("/api/v1/rooms/{roomId}/github/attention/{itemKey}/dismiss")
    public ResponseEntity<Void> dismissAttention(
            @PathVariable UUID roomId,
            @PathVariable String itemKey,
            @AuthenticationPrincipal User user
    ) {
        gitHubService.dismissAttention(roomId, itemKey, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/v1/github/my-repos")
    public List<MyRepoDto> getMyRepos(@AuthenticationPrincipal User user) {
        return gitHubService.getMyRepos(user);
    }
}
