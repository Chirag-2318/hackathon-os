package com.hackathonos.backend.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.github.dto.GithubDtos.*;
import com.hackathonos.backend.users.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
public class GitHubController {

    private final GitHubService gitHubService;
    private final CurrentUser currentUser;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;

    public GitHubController(GitHubService gitHubService,
                            CurrentUser currentUser,
                            AppProperties appProperties,
                            ObjectMapper objectMapper) {
        this.gitHubService = gitHubService;
        this.currentUser = currentUser;
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
    }

    private User resolveUser(User user) {
        return user != null ? user : currentUser.get();
    }

    @GetMapping({"/rooms/{roomId}/github", "/api/v1/rooms/{roomId}/github"})
    public GithubPageResponse getPage(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.getPage(roomId, resolveUser(user));
    }

    @PostMapping({"/rooms/{roomId}/github/link", "/api/v1/rooms/{roomId}/github/link"})
    public ResponseEntity<RepoSummarySectionDto> link(
            @PathVariable UUID roomId,
            @RequestBody LinkRepoRequest request,
            @AuthenticationPrincipal User user
    ) {
        RepoSummarySectionDto summary = gitHubService.link(roomId, request, resolveUser(user));
        return ResponseEntity.ok(summary);
    }

    @GetMapping({"/rooms/{roomId}/github/summary", "/api/v1/rooms/{roomId}/github/summary"})
    public ResponseEntity<SectionResponse<RepoSummarySectionDto>> getSummary(
            @PathVariable UUID roomId,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch,
            @AuthenticationPrincipal User user
    ) {
        return handleSectionResponse(gitHubService.getSummarySection(roomId, resolveUser(user)), ifNoneMatch);
    }

    @GetMapping({"/rooms/{roomId}/github/branches", "/api/v1/rooms/{roomId}/github/branches"})
    public ResponseEntity<SectionResponse<List<BranchDto>>> getBranches(
            @PathVariable UUID roomId,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch,
            @AuthenticationPrincipal User user
    ) {
        return handleSectionResponse(gitHubService.getBranchesSection(roomId, resolveUser(user)), ifNoneMatch);
    }

    @GetMapping({"/rooms/{roomId}/github/commits", "/api/v1/rooms/{roomId}/github/commits"})
    public ResponseEntity<SectionResponse<List<CommitItemDto>>> getCommits(
            @PathVariable UUID roomId,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch,
            @AuthenticationPrincipal User user
    ) {
        return handleSectionResponse(gitHubService.getCommitsSection(roomId, resolveUser(user)), ifNoneMatch);
    }

    @GetMapping({"/rooms/{roomId}/github/pulls", "/api/v1/rooms/{roomId}/github/pulls"})
    public ResponseEntity<SectionResponse<List<PullItemDto>>> getPulls(
            @PathVariable UUID roomId,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch,
            @AuthenticationPrincipal User user
    ) {
        return handleSectionResponse(gitHubService.getPullsSection(roomId, resolveUser(user)), ifNoneMatch);
    }

    @GetMapping({"/rooms/{roomId}/github/health", "/api/v1/rooms/{roomId}/github/health"})
    public ResponseEntity<SectionResponse<List<HealthItemDto>>> getHealth(
            @PathVariable UUID roomId,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch,
            @AuthenticationPrincipal User user
    ) {
        return handleSectionResponse(gitHubService.getHealthSection(roomId, resolveUser(user)), ifNoneMatch);
    }

    @GetMapping({"/rooms/{roomId}/github/checks", "/api/v1/rooms/{roomId}/github/checks"})
    public List<GithubCheckDto> getChecks(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.getChecks(roomId, resolveUser(user));
    }

    @GetMapping({"/rooms/{roomId}/github/contributors", "/api/v1/rooms/{roomId}/github/contributors"})
    public GithubContributorsResponse getContributors(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.getContributors(roomId, resolveUser(user));
    }

    @GetMapping({"/rooms/{roomId}/github/task-links", "/api/v1/rooms/{roomId}/github/task-links"})
    public GithubTaskLinksResponse getTaskLinks(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.getTaskLinks(roomId, resolveUser(user));
    }

    @GetMapping({"/rooms/{roomId}/github/demo-marker", "/api/v1/rooms/{roomId}/github/demo-marker"})
    public ResponseEntity<DemoMarkerDto> getDemoMarker(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        DemoMarkerDto marker = gitHubService.getDemoMarker(roomId, resolveUser(user));
        return ResponseEntity.ok(marker);
    }

    @PostMapping({"/rooms/{roomId}/github/demo-marker", "/api/v1/rooms/{roomId}/github/demo-marker"})
    public DemoMarkerDto saveDemoMarker(
            @PathVariable UUID roomId,
            @RequestBody(required = false) SaveDemoMarkerRequest request,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.saveDemoMarker(roomId, request, resolveUser(user));
    }

    @DeleteMapping({"/rooms/{roomId}/github/demo-marker", "/api/v1/rooms/{roomId}/github/demo-marker"})
    public ResponseEntity<Void> deleteDemoMarker(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        gitHubService.deleteDemoMarker(roomId, resolveUser(user));
        return ResponseEntity.noContent().build();
    }

    private <T> ResponseEntity<SectionResponse<T>> handleSectionResponse(SectionResponse<T> resp, String ifNoneMatch) {
        String etag = "\"" + Integer.toHexString(java.util.Objects.hash(resp.data(), resp.state(), resp.error())) + "\"";
        if (ifNoneMatch != null && ifNoneMatch.equals(etag)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_MODIFIED).eTag(etag).build();
        }
        return ResponseEntity.ok()
                .eTag(etag)
                .cacheControl(org.springframework.http.CacheControl.maxAge(java.time.Duration.ofMinutes(3)))
                .body(resp);
    }

    @PostMapping({"/rooms/{roomId}/github/connect", "/api/v1/rooms/{roomId}/github/connect"})
    public GithubPageResponse connect(
            @PathVariable UUID roomId,
            @RequestBody ConnectRepoRequest request,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.connect(roomId, request, resolveUser(user));
    }

    @DeleteMapping("/api/v1/rooms/{roomId}/github/connect")
    public ResponseEntity<Void> disconnect(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        gitHubService.disconnect(roomId, resolveUser(user));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/rooms/{roomId}/github/sync")
    public GithubPageResponse sync(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.sync(roomId, resolveUser(user));
    }

    @PatchMapping("/api/v1/rooms/{roomId}/github/branches/{branchId}")
    public BranchDto updateBranch(
            @PathVariable UUID roomId,
            @PathVariable UUID branchId,
            @RequestBody UpdateBranchRequest request,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.updateBranch(roomId, branchId, request, resolveUser(user));
    }

    @PutMapping("/api/v1/rooms/{roomId}/github/branches/{branchId}/tasks")
    public BranchDto linkBranchTasks(
            @PathVariable UUID roomId,
            @PathVariable UUID branchId,
            @RequestBody LinkBranchTasksRequest request,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.linkBranchTasks(roomId, branchId, request, resolveUser(user));
    }

    @PutMapping("/api/v1/rooms/{roomId}/github/deployed-link")
    public DeployedLinkResponse updateDeployedLink(
            @PathVariable UUID roomId,
            @RequestBody DeployedLinkRequest request,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.updateDeployedLink(roomId, request, resolveUser(user));
    }

    @PostMapping("/api/v1/rooms/{roomId}/github/freeze")
    public FreezeResponse freezeDemo(
            @PathVariable UUID roomId,
            @RequestBody FreezeRequest request,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.freezeDemo(roomId, request, resolveUser(user));
    }

    @GetMapping("/api/v1/rooms/{roomId}/github/freeze")
    public FreezeChecklistResponse getFreezeChecklist(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.getFreezeChecklist(roomId, resolveUser(user));
    }

    @PostMapping("/api/v1/rooms/{roomId}/github/attention/{itemKey}/dismiss")
    public ResponseEntity<Void> dismissAttention(
            @PathVariable UUID roomId,
            @PathVariable String itemKey,
            @AuthenticationPrincipal User user
    ) {
        gitHubService.dismissAttention(roomId, itemKey, resolveUser(user));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/v1/github/link/start")
    public void startLink(
            @RequestParam(required = false) UUID roomId,
            @RequestParam(defaultValue = "false") boolean privateRepos,
            @AuthenticationPrincipal User user,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        User resolved = resolveUser(user);
        if (resolved == null || resolved.getId() == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return;
        }

        String clientId = appProperties.getGithub().getLinkClientId();
        if (clientId == null || clientId.isBlank()) {
            String fallback = appProperties.getFrontendUrl() + (roomId != null ? "/app/room/" + roomId + "/github?github=error&reason=NOT_CONFIGURED" : "");
            response.sendRedirect(fallback);
            return;
        }

        String state = UUID.randomUUID().toString();
        HttpSession session = request.getSession(true);
        session.setAttribute("gh_link_state", state);
        session.setAttribute("gh_link_room_id", roomId != null ? roomId.toString() : "");
        session.setAttribute("gh_link_user_id", resolved.getId().toString());
        session.setAttribute("gh_link_private_repos", privateRepos);

        String redirectUri = appProperties.getBaseUrl() + "/api/v1/github/link/callback";
        String scope = privateRepos ? "repo" : "read:user";
        String authorizeUrl = "https://github.com/login/oauth/authorize?client_id="
                + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
                + "&state=" + URLEncoder.encode(state, StandardCharsets.UTF_8)
                + "&scope=" + URLEncoder.encode(scope, StandardCharsets.UTF_8);

        response.setStatus(HttpServletResponse.SC_FOUND);
        response.setHeader("Location", authorizeUrl);
    }

    @GetMapping("/api/v1/github/link/callback")
    public void linkCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        HttpSession session = request.getSession(false);
        String roomId = session != null ? (String) session.getAttribute("gh_link_room_id") : null;
        String returnPath = session != null ? (String) session.getAttribute("gh_link_return_path") : null;
        String fallbackRedirect = appProperties.getFrontendUrl() + (returnPath != null && !returnPath.isBlank()
                ? returnPath
                : (roomId != null && !roomId.isBlank() ? "/app/room/" + roomId + "/github" : "/app/settings/integrations"));

        try {
            if (session == null || state == null || !state.equals(session.getAttribute("gh_link_state"))) {
                response.sendRedirect(fallbackRedirect + "?github=error&reason=state_mismatch");
                return;
            }

            if (code == null || code.isBlank()) {
                response.sendRedirect(fallbackRedirect + "?github=error&reason=no_code");
                return;
            }

            String userIdStr = (String) session.getAttribute("gh_link_user_id");
            if (userIdStr == null || userIdStr.isBlank()) {
                response.sendRedirect(fallbackRedirect + "?github=error&reason=no_session_user");
                return;
            }
            UUID userId = UUID.fromString(userIdStr);
            boolean privateRepos = Boolean.TRUE.equals(session.getAttribute("gh_link_private_repos"));
            String defaultScope = privateRepos ? "repo" : "read:user";

            String clientId = appProperties.getGithub().getLinkClientId();
            String clientSecret = appProperties.getGithub().getLinkClientSecret();
            String redirectUri = appProperties.getBaseUrl() + "/api/v1/github/link/callback";

            URL tokenUrl = URI.create("https://github.com/login/oauth/access_token").toURL();
            HttpURLConnection conn = (HttpURLConnection) tokenUrl.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setDoOutput(true);
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");

            String formBody = "client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                    + "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8)
                    + "&code=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
                    + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(formBody.getBytes(StandardCharsets.UTF_8));
            }

            if (conn.getResponseCode() >= 400) {
                response.sendRedirect(fallbackRedirect + "?github=error&reason=token_exchange_failed");
                return;
            }

            JsonNode tokenNode;
            try (InputStream in = conn.getInputStream()) {
                tokenNode = objectMapper.readTree(in);
            }

            String accessToken = tokenNode.path("access_token").asText(null);
            if (accessToken == null || accessToken.isBlank()) {
                String errReason = tokenNode.path("error").asText("no_access_token");
                response.sendRedirect(fallbackRedirect + "?github=error&reason=" + URLEncoder.encode(errReason, StandardCharsets.UTF_8));
                return;
            }

            String scope = tokenNode.hasNonNull("scope") ? tokenNode.path("scope").asText(defaultScope) : defaultScope;

            URL userUrl = URI.create("https://api.github.com/user").toURL();
            HttpURLConnection userConn = (HttpURLConnection) userUrl.openConnection();
            userConn.setRequestMethod("GET");
            userConn.setConnectTimeout(8000);
            userConn.setReadTimeout(8000);
            userConn.setRequestProperty("Accept", "application/vnd.github+json");
            userConn.setRequestProperty("Authorization", "Bearer " + accessToken);
            userConn.setRequestProperty("User-Agent", "brackit-Server");

            if (userConn.getResponseCode() >= 400) {
                response.sendRedirect(fallbackRedirect + "?github=error&reason=fetch_user_failed");
                return;
            }

            JsonNode userNode;
            try (InputStream in = userConn.getInputStream()) {
                userNode = objectMapper.readTree(in);
            }

            String githubLogin = userNode.path("login").asText();

            gitHubService.saveLinkedToken(userId, accessToken, scope, githubLogin);

            session.removeAttribute("gh_link_state");
            session.removeAttribute("gh_link_room_id");
            session.removeAttribute("gh_link_user_id");
            session.removeAttribute("gh_link_private_repos");
            session.removeAttribute("gh_link_return_path");

            response.sendRedirect(fallbackRedirect + "?github=connected");
        } catch (Exception e) {
            response.sendRedirect(fallbackRedirect + "?github=error&reason=unexpected_error");
        }
    }

    @GetMapping("/api/v1/github/status")
    public GitHubStatusDto getStatus(@AuthenticationPrincipal User user) {
        return gitHubService.getLinkStatus(resolveUser(user));
    }

    @DeleteMapping("/api/v1/github/link")
    public ResponseEntity<Void> disconnectLink(@AuthenticationPrincipal User user) {
        gitHubService.disconnectLink(resolveUser(user));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/v1/github/my-repos")
    public List<MyRepoDto> getMyRepos(
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal User user
    ) {
        return gitHubService.getMyRepos(resolveUser(user), search);
    }
}
