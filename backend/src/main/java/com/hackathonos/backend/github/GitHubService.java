package com.hackathonos.backend.github;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.common.error.*;
import com.hackathonos.backend.common.http.SafeHttpClient;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.common.security.SecretCipher;
import com.hackathonos.backend.github.calc.*;
import com.hackathonos.backend.github.client.GitHubApiException;
import com.hackathonos.backend.github.client.GitHubClient;
import com.hackathonos.backend.github.client.GitHubClientResolver;
import com.hackathonos.backend.github.client.GitHubRateLimitException;
import com.hackathonos.backend.github.dto.GithubDtos.*;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserOAuthToken;
import com.hackathonos.backend.users.UserOAuthTokenRepository;
import com.hackathonos.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class GitHubService {

    private static final Logger log = LoggerFactory.getLogger(GitHubService.class);

    private static final Pattern TAG_PATTERN = Pattern.compile("^[A-Za-z0-9._/-]{1,60}$");

    private final ExecutorService githubExecutor = Executors.newFixedThreadPool(8);

    private static class CacheEntry<T> {
        final Instant cachedAt;
        final String etag;
        final SectionResponse<T> response;
        final int rateLimitRemaining;

        CacheEntry(Instant cachedAt, String etag, SectionResponse<T> response, int rateLimitRemaining) {
            this.cachedAt = cachedAt;
            this.etag = etag;
            this.response = response;
            this.rateLimitRemaining = rateLimitRemaining;
        }
    }

    private final Map<String, CacheEntry<?>> sectionCache = new ConcurrentHashMap<>();

    private final GithubRepoRepository repoRepository;
    private final GithubBranchRepository branchRepository;
    private final GithubBranchTaskRepository branchTaskRepository;
    private final GithubCommitRepository commitRepository;
    private final GithubHealthItemRepository healthRepository;
    private final GithubFrozenDemoRepository frozenRepository;
    private final GithubAttentionDismissalRepository dismissalRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final UserOAuthTokenRepository userOAuthTokenRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final BriefRepository briefRepository;
    private final RoomGithubDemoRepository roomGithubDemoRepository;
    private final SecretCipher secretCipher;
    private final RoomAccess roomAccess;
    private final GitHubSyncService syncService;
    private final GitHubClientResolver clientResolver;
    private final SafeHttpClient safeHttpClient;
    private final ActivityLogger activityLogger;
    private final NotificationService notificationService;
    private final Clock clock;

    public GitHubService(GithubRepoRepository repoRepository,
                         GithubBranchRepository branchRepository,
                         GithubBranchTaskRepository branchTaskRepository,
                         GithubCommitRepository commitRepository,
                         GithubHealthItemRepository healthRepository,
                         GithubFrozenDemoRepository frozenRepository,
                         GithubAttentionDismissalRepository dismissalRepository,
                         TaskRepository taskRepository,
                         UserRepository userRepository,
                         UserOAuthTokenRepository userOAuthTokenRepository,
                         RoomMemberRepository roomMemberRepository,
                         BriefRepository briefRepository,
                         RoomGithubDemoRepository roomGithubDemoRepository,
                         SecretCipher secretCipher,
                         RoomAccess roomAccess,
                         GitHubSyncService syncService,
                         GitHubClientResolver clientResolver,
                         SafeHttpClient safeHttpClient,
                         ActivityLogger activityLogger,
                         NotificationService notificationService,
                         Clock clock) {
        this.repoRepository = repoRepository;
        this.branchRepository = branchRepository;
        this.branchTaskRepository = branchTaskRepository;
        this.commitRepository = commitRepository;
        this.healthRepository = healthRepository;
        this.frozenRepository = frozenRepository;
        this.dismissalRepository = dismissalRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.userOAuthTokenRepository = userOAuthTokenRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.briefRepository = briefRepository;
        this.roomGithubDemoRepository = roomGithubDemoRepository;
        this.secretCipher = secretCipher;
        this.roomAccess = roomAccess;
        this.syncService = syncService;
        this.clientResolver = clientResolver;
        this.safeHttpClient = safeHttpClient;
        this.activityLogger = activityLogger;
        this.notificationService = notificationService;
        this.clock = clock;
    }

    /**
     * Returns the full GitHub Hub page model for a room, or un-connected state if not connected.
     */
    @Transactional(readOnly = true)
    public GithubPageResponse getPage(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        RoomMember member = roomAccess.requireMember(roomId, user);
        boolean isLeader = "LEADER".equalsIgnoreCase(member.getRole());
        Optional<GithubRepo> repoOpt = repoRepository.findById(roomId);
        boolean tokenAvailable = user != null && user.getId() != null && clientResolver.resolveToken(user.getId()).token() != null;

        if (repoOpt.isEmpty()) {
            return new GithubPageResponse(
                    false, null, null, Collections.emptyList(),
                    Collections.emptyList(), Collections.emptyList(), null,
                    Collections.emptyList(), false, null, null,
                    new PermissionsDto(isLeader, isLeader, isLeader),
                    clock.instant(), isLeader, tokenAvailable
            );
        }

        GithubRepo repo = repoOpt.get();
        return buildPageResponse(room, repo, user, isLeader);
    }

    @SuppressWarnings("unchecked")
    private <T> void putCache(UUID roomId, String section, SectionResponse<T> response, int remaining) {
        String etag = "\"" + Integer.toHexString(Objects.hash(response.data(), response.state(), response.error())) + "\"";
        sectionCache.put(roomId.toString() + ":" + section, new CacheEntry<>(clock.instant(), etag, response, remaining));
    }

    /**
     * Connects a repository to the room, verifies existence on GitHub, saves it fast, and returns page model.
     */
    @Transactional
    public GithubPageResponse connect(UUID roomId, ConnectRepoRequest request, User user) {
        String input = request != null ? request.getEffectiveRepo() : null;
        link(roomId, new LinkRepoRequest(input, input), user);
        return getPage(roomId, user);
    }

    /**
     * Link step validating in under 2s with one GET call to GitHub.
     */
    @Transactional
    public RepoSummarySectionDto link(UUID roomId, LinkRepoRequest request, User user) {
        long start = System.currentTimeMillis();
        String rawInput = request != null ? request.getEffectiveUrl() : null;
        log.info("[GitHub Link] Stage 1 - Parsing URL: {}", rawInput);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireLeader(roomId, user);

        String parsedFullName = parseRepoInput(rawInput);
        String[] parts = parsedFullName.split("/");
        String owner = parts[0];
        String repoName = parts[1];

        log.info("[GitHub Link] Stage 2 - Resolving auth token (elapsed: {}ms)", System.currentTimeMillis() - start);
        GitHubClient client = clientResolver.resolveClient(parsedFullName);
        GitHubClientResolver.ResolvedToken resolvedToken = clientResolver.resolveToken(user != null ? user.getId() : null);
        String currentToken = resolvedToken.token();
        String currentTokenSource = resolvedToken.source();

        log.info("[GitHub Link] Stage 3 - Calling GitHub GET /repos/{}/{} (elapsed: {}ms)", owner, repoName, System.currentTimeMillis() - start);
        GitHubClient.ClientRepo clientRepo = null;
        try {
            clientRepo = client.getRepo(owner, repoName, currentToken).orElse(null);
        } catch (GitHubApiException e) {
            int status = e.getStatusCode();
            if (status == 401 && currentToken != null) {
                log.warn("GitHub token invalid from source {}: retrying without token for {}/{}", currentTokenSource, owner, repoName);
                currentToken = null;
                currentTokenSource = "none";
                try {
                    clientRepo = client.getRepo(owner, repoName, null).orElse(null);
                } catch (GitHubApiException retryEx) {
                    handleConnectFailure(retryEx.getStatusCode(), currentTokenSource, owner, repoName, retryEx);
                } catch (Exception retryEx) {
                    handleConnectFailure(500, currentTokenSource, owner, repoName, retryEx);
                }
            } else {
                handleConnectFailure(status, currentTokenSource, owner, repoName, e);
            }
        } catch (Exception e) {
            handleConnectFailure(500, currentTokenSource, owner, repoName, e);
        }

        if (clientRepo == null) {
            handleConnectFailure(404, currentTokenSource, owner, repoName, null);
        }

        log.info("[GitHub Link] Stage 4 - Saving repo entity in DB (elapsed: {}ms)", System.currentTimeMillis() - start);
        GithubRepo repo = repoRepository.findById(roomId).orElse(null);
        if (repo == null) {
            repo = new GithubRepo(
                    roomId, clientRepo.fullName(), clientRepo.url(), clientRepo.visibility(),
                    clientRepo.defaultBranch(), "read-only", user != null ? user.getId() : null, clock.instant(),
                    null, "idle", null, null, currentTokenSource
            );
        } else {
            repo.setFullName(clientRepo.fullName());
            repo.setUrl(clientRepo.url());
            repo.setVisibility(clientRepo.visibility());
            repo.setDefaultBranch(clientRepo.defaultBranch());
            repo.setConnectedBy(user != null ? user.getId() : null);
            repo.setTokenSource(currentTokenSource);
            repo.setLastSyncAt(clock.instant());
        }
        repoRepository.save(repo);

        activityLogger.log(room, user, "GITHUB_CONNECTED", "Connected repository " + repo.getFullName());
        log.info("[GitHub Link] Completed in {}ms", System.currentTimeMillis() - start);

        return new RepoSummarySectionDto(
                clientRepo.name(),
                clientRepo.description(),
                clientRepo.visibility(),
                clientRepo.defaultBranch(),
                clientRepo.language(),
                clientRepo.stars(),
                clientRepo.pushedDate(),
                clientRepo.htmlUrl(),
                clientRepo.fullName(),
                true
        );
    }

    private void handleConnectFailure(int status, String tokenSource, String owner, String repo, Exception cause) {
        log.warn("GitHub connect/link failed: status={}, tokenSource={}, repo={}/{}", status, tokenSource, owner, repo);
        if (status == 404) {
            throw new NotFoundException("REPO_NOT_FOUND", "Repository not found, or it is private. Allow private repositories in Settings, Integrations.");
        }
        if (status == 401) {
            throw new UnauthenticatedException("GITHUB_UNAUTHENTICATED", "Reconnect GitHub");
        }
        if (cause instanceof GitHubApiException apiEx && (apiEx.isRateLimit() || apiEx.getStatusCode() == 429)) {
            throw new TooManyRequestsException("GITHUB_RATE_LIMIT", "GitHub API rate limit exceeded. Resets at " + apiEx.getResetInstant());
        }
        if (cause instanceof GitHubRateLimitException rateEx) {
            throw new TooManyRequestsException("GITHUB_RATE_LIMIT", "GitHub API rate limit exceeded. Resets at " + rateEx.getResetAt());
        }
        if (status == 403) {
            if (cause instanceof GitHubApiException apiEx && "0".equals(apiEx.getRateLimitRemaining())) {
                throw new TooManyRequestsException("GITHUB_RATE_LIMIT", "GitHub API rate limit exceeded. Resets at " + apiEx.getResetInstant());
            }
            throw new ForbiddenException("GITHUB_FORBIDDEN", "GitHub access forbidden. Check permissions for this repository.");
        }
        throw new BadRequestException("GITHUB_ERROR", "GitHub connection failed (" + status + ")");
    }

    @SuppressWarnings("unchecked")
    public SectionResponse<RepoSummarySectionDto> getSummarySection(UUID roomId, User user) {
        GithubRepo repo = repoRepository.findById(roomId).orElse(null);
        if (repo == null) {
            return SectionResponse.error("No repository connected");
        }
        String cacheKey = roomId + ":summary";
        CacheEntry<RepoSummarySectionDto> cached = (CacheEntry<RepoSummarySectionDto>) sectionCache.get(cacheKey);

        String[] parts = repo.getFullName().split("/");
        GitHubClient client = clientResolver.resolveClient(repo.getFullName());
        int remaining = client.getRateLimitRemaining();

        if (cached != null) {
            boolean fresh = Duration.between(cached.cachedAt, clock.instant()).toSeconds() < 180;
            if (fresh) {
                return remaining < 5
                        ? SectionResponse.readyWithNotice(cached.response.data(), "Showing saved data")
                        : cached.response;
            }
            if (remaining < 5) {
                return SectionResponse.readyWithNotice(cached.response.data(), "Showing saved data");
            }
        }

        if (remaining < 5) {
            return SectionResponse.error("GitHub rate limit reached");
        }

        try {
            CompletableFuture<RepoSummarySectionDto> future = CompletableFuture.supplyAsync(() -> {
                GitHubClientResolver.ResolvedToken resolvedToken = clientResolver.resolveToken(user != null ? user.getId() : repo.getConnectedBy());
                GitHubClient.ClientRepo cr = client.getRepo(parts[0], parts[1], resolvedToken.token()).orElse(null);
                if (cr == null) return null;
                return new RepoSummarySectionDto(
                        cr.name(), cr.description(), cr.visibility(), cr.defaultBranch(),
                        cr.language(), cr.stars(), cr.pushedDate(), cr.htmlUrl(), cr.fullName(), true
                );
            }, githubExecutor);

            RepoSummarySectionDto dto = future.get(8, TimeUnit.SECONDS);
            if (dto == null) {
                return cached != null
                        ? SectionResponse.partial(cached.response.data(), "Repository details unavailable", "Showing saved data")
                        : SectionResponse.error("Repository not found");
            }
            SectionResponse<RepoSummarySectionDto> resp = SectionResponse.ready(dto);
            putCache(roomId, "summary", resp, client.getRateLimitRemaining());
            return resp;
        } catch (Exception e) {
            log.warn("Summary section fetch failed: {}", e.getMessage());
            return cached != null
                    ? SectionResponse.partial(cached.response.data(), "GitHub is slow right now", "Showing saved data")
                    : SectionResponse.error("GitHub is slow right now. Retry, or open the repository on GitHub.");
        }
    }

    @SuppressWarnings("unchecked")
    public SectionResponse<List<BranchDto>> getBranchesSection(UUID roomId, User user) {
        GithubRepo repo = repoRepository.findById(roomId).orElse(null);
        if (repo == null) {
            return SectionResponse.error("No repository connected");
        }
        String cacheKey = roomId + ":branches";
        CacheEntry<List<BranchDto>> cached = (CacheEntry<List<BranchDto>>) sectionCache.get(cacheKey);

        String[] parts = repo.getFullName().split("/");
        GitHubClient client = clientResolver.resolveClient(repo.getFullName());
        int remaining = client.getRateLimitRemaining();

        if (cached != null) {
            boolean fresh = Duration.between(cached.cachedAt, clock.instant()).toSeconds() < 180;
            if (fresh) {
                return remaining < 5
                        ? SectionResponse.readyWithNotice(cached.response.data(), "Showing saved data")
                        : cached.response;
            }
            if (remaining < 5) {
                return SectionResponse.readyWithNotice(cached.response.data(), "Showing saved data");
            }
        }

        if (remaining < 5) {
            return SectionResponse.error("GitHub rate limit reached");
        }

        try {
            CompletableFuture<List<BranchDto>> future = CompletableFuture.supplyAsync(() -> {
                GitHubClientResolver.ResolvedToken resolvedToken = clientResolver.resolveToken(user != null ? user.getId() : repo.getConnectedBy());
                String token = resolvedToken.token();
                List<GitHubClient.ClientBranch> fetched = client.listBranches(parts[0], parts[1], token);
                if (fetched == null || fetched.isEmpty()) return Collections.<BranchDto>emptyList();

                List<GithubBranch> dbBranches = branchRepository.findByRoomId(roomId);
                Map<String, GithubBranch> dbMap = new HashMap<>();
                for (GithubBranch b : dbBranches) {
                    dbMap.put(b.getName(), b);
                }

                List<GitHubClient.ClientBranch> limited = fetched.stream().limit(30).toList();

                List<CompletableFuture<BranchDto>> branchFutures = new ArrayList<>();
                for (int i = 0; i < limited.size(); i++) {
                    final int idx = i;
                    final GitHubClient.ClientBranch fb = limited.get(i);
                    boolean shouldCompare = idx < 10 && !fb.name().equalsIgnoreCase(repo.getDefaultBranch());

                    branchFutures.add(CompletableFuture.supplyAsync(() -> {
                        Integer ahead = null;
                        Integer behind = null;
                        if (fb.name().equalsIgnoreCase(repo.getDefaultBranch())) {
                            ahead = 0;
                            behind = 0;
                        } else if (shouldCompare) {
                            try {
                                GitHubClient.ClientBranchCompare cmp = client.compareBranches(parts[0], parts[1], repo.getDefaultBranch(), fb.name(), token);
                                ahead = cmp.aheadBy();
                                behind = cmp.behindBy();
                            } catch (Exception ignored) {}
                        }
                        GithubBranch db = dbMap.get(fb.name());
                        UUID branchId = db != null ? db.getId() : UUID.randomUUID();
                        String role = db != null ? db.getRole() : (fb.name().equalsIgnoreCase(repo.getDefaultBranch()) ? "main" : "experiment");
                        String purpose = db != null ? db.getPurpose() : null;
                        String url = "https://github.com/" + repo.getFullName() + "/tree/" + fb.name();
                        return new BranchDto(
                                branchId, fb.name(), purpose, role, null,
                                ahead, behind, clock.instant(), fb.sha(), "",
                                null, Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), url
                        );
                    }, githubExecutor));
                }

                List<BranchDto> results = new ArrayList<>();
                for (CompletableFuture<BranchDto> bf : branchFutures) {
                    try {
                        results.add(bf.get(8, TimeUnit.SECONDS));
                    } catch (Exception ignored) {}
                }
                return results;
            }, githubExecutor);

            List<BranchDto> dtoList = future.get(15, TimeUnit.SECONDS);
            SectionResponse<List<BranchDto>> resp = SectionResponse.ready(dtoList);
            putCache(roomId, "branches", resp, client.getRateLimitRemaining());
            return resp;
        } catch (Exception e) {
            log.warn("Branches section fetch failed: {}", e.getMessage());
            return cached != null
                    ? SectionResponse.partial(cached.response.data(), "GitHub is slow right now", "Showing saved data")
                    : SectionResponse.error("GitHub is slow right now. Retry, or open the repository on GitHub.");
        }
    }

    @SuppressWarnings("unchecked")
    public SectionResponse<List<CommitItemDto>> getCommitsSection(UUID roomId, User user) {
        GithubRepo repo = repoRepository.findById(roomId).orElse(null);
        if (repo == null) {
            return SectionResponse.error("No repository connected");
        }
        String cacheKey = roomId + ":commits";
        CacheEntry<List<CommitItemDto>> cached = (CacheEntry<List<CommitItemDto>>) sectionCache.get(cacheKey);

        String[] parts = repo.getFullName().split("/");
        GitHubClient client = clientResolver.resolveClient(repo.getFullName());
        int remaining = client.getRateLimitRemaining();

        if (cached != null) {
            boolean fresh = Duration.between(cached.cachedAt, clock.instant()).toSeconds() < 180;
            if (fresh) {
                return remaining < 5
                        ? SectionResponse.readyWithNotice(cached.response.data(), "Showing saved data")
                        : cached.response;
            }
            if (remaining < 5) {
                return SectionResponse.readyWithNotice(cached.response.data(), "Showing saved data");
            }
        }

        if (remaining < 5) {
            return SectionResponse.error("GitHub rate limit reached");
        }

        try {
            CompletableFuture<List<CommitItemDto>> future = CompletableFuture.supplyAsync(() -> {
                GitHubClientResolver.ResolvedToken resolvedToken = clientResolver.resolveToken(user != null ? user.getId() : repo.getConnectedBy());
                List<GitHubClient.ClientCommit> rawCommits = client.listCommits(parts[0], parts[1], repo.getDefaultBranch(), null, null, resolvedToken.token());
                if (rawCommits == null) return Collections.<CommitItemDto>emptyList();
                return rawCommits.stream().limit(30).map(c -> new CommitItemDto(
                        c.sha(),
                        c.message(),
                        c.authorLogin(),
                        c.authorName(),
                        c.committedAt(),
                        "https://github.com/" + repo.getFullName() + "/commit/" + c.sha()
                )).toList();
            }, githubExecutor);

            List<CommitItemDto> list = future.get(8, TimeUnit.SECONDS);
            SectionResponse<List<CommitItemDto>> resp = SectionResponse.ready(list);
            putCache(roomId, "commits", resp, client.getRateLimitRemaining());
            return resp;
        } catch (Exception e) {
            log.warn("Commits section fetch failed: {}", e.getMessage());
            return cached != null
                    ? SectionResponse.partial(cached.response.data(), "GitHub is slow right now", "Showing saved data")
                    : SectionResponse.error("GitHub is slow right now. Retry, or open the repository on GitHub.");
        }
    }

    @SuppressWarnings("unchecked")
    public SectionResponse<List<PullItemDto>> getPullsSection(UUID roomId, User user) {
        GithubRepo repo = repoRepository.findById(roomId).orElse(null);
        if (repo == null) {
            return SectionResponse.error("No repository connected");
        }
        String cacheKey = roomId + ":pulls";
        CacheEntry<List<PullItemDto>> cached = (CacheEntry<List<PullItemDto>>) sectionCache.get(cacheKey);

        String[] parts = repo.getFullName().split("/");
        GitHubClient client = clientResolver.resolveClient(repo.getFullName());
        int remaining = client.getRateLimitRemaining();

        if (cached != null) {
            boolean fresh = Duration.between(cached.cachedAt, clock.instant()).toSeconds() < 180;
            if (fresh) {
                return remaining < 5
                        ? SectionResponse.readyWithNotice(cached.response.data(), "Showing saved data")
                        : cached.response;
            }
            if (remaining < 5) {
                return SectionResponse.readyWithNotice(cached.response.data(), "Showing saved data");
            }
        }

        if (remaining < 5) {
            return SectionResponse.error("GitHub rate limit reached");
        }

        try {
            CompletableFuture<List<PullItemDto>> future = CompletableFuture.supplyAsync(() -> {
                GitHubClientResolver.ResolvedToken resolvedToken = clientResolver.resolveToken(user != null ? user.getId() : repo.getConnectedBy());
                List<GitHubClient.ClientPr> prs = client.listPullRequests(parts[0], parts[1], resolvedToken.token());
                if (prs == null) return Collections.<PullItemDto>emptyList();
                return prs.stream().limit(20).map(p -> new PullItemDto(
                        p.number(),
                        p.title(),
                        p.headBranch(),
                        p.state(),
                        p.draft(),
                        p.openedAt(),
                        "https://github.com/" + repo.getFullName() + "/pull/" + p.number()
                )).toList();
            }, githubExecutor);

            List<PullItemDto> list = future.get(8, TimeUnit.SECONDS);
            SectionResponse<List<PullItemDto>> resp = SectionResponse.ready(list);
            putCache(roomId, "pulls", resp, client.getRateLimitRemaining());
            return resp;
        } catch (Exception e) {
            log.warn("Pulls section fetch failed: {}", e.getMessage());
            return cached != null
                    ? SectionResponse.partial(cached.response.data(), "GitHub is slow right now", "Showing saved data")
                    : SectionResponse.error("GitHub is slow right now. Retry, or open the repository on GitHub.");
        }
    }

    @SuppressWarnings("unchecked")
    public SectionResponse<List<HealthItemDto>> getHealthSection(UUID roomId, User user) {
        GithubRepo repo = repoRepository.findById(roomId).orElse(null);
        if (repo == null) {
            return SectionResponse.error("No repository connected");
        }
        String cacheKey = roomId + ":health";
        CacheEntry<List<HealthItemDto>> cached = (CacheEntry<List<HealthItemDto>>) sectionCache.get(cacheKey);

        String[] parts = repo.getFullName().split("/");
        GitHubClient client = clientResolver.resolveClient(repo.getFullName());
        int remaining = client.getRateLimitRemaining();

        if (cached != null) {
            boolean fresh = Duration.between(cached.cachedAt, clock.instant()).toSeconds() < 180;
            if (fresh) {
                return remaining < 5
                        ? SectionResponse.readyWithNotice(cached.response.data(), "Showing saved data")
                        : cached.response;
            }
            if (remaining < 5) {
                return SectionResponse.readyWithNotice(cached.response.data(), "Showing saved data");
            }
        }

        if (remaining < 5) {
            return SectionResponse.error("GitHub rate limit reached");
        }

        try {
            CompletableFuture<List<HealthItemDto>> future = CompletableFuture.supplyAsync(() -> {
                GitHubClientResolver.ResolvedToken resolvedToken = clientResolver.resolveToken(user != null ? user.getId() : repo.getConnectedBy());
                String token = resolvedToken.token();
                List<String> treeFiles = client.getTreeFilePaths(parts[0], parts[1], repo.getDefaultBranch(), token);
                if (treeFiles == null) treeFiles = Collections.emptyList();

                List<HealthItemDto> healthList = new ArrayList<>();

                // 1. README
                boolean hasReadme = treeFiles.stream().anyMatch(f -> f.equalsIgnoreCase("README.md") || f.equalsIgnoreCase("README"));
                healthList.add(new HealthItemDto(
                        "readme", "README file", hasReadme ? "pass" : "fail", true,
                        "Project README documenting solution and setup",
                        new HealthActionDto("Create README", "https://github.com/" + repo.getFullName() + "/new/" + repo.getDefaultBranch() + "?filename=README.md")
                ));

                // 2. license
                boolean hasLicense = treeFiles.stream().anyMatch(f -> f.equalsIgnoreCase("LICENSE") || f.equalsIgnoreCase("LICENSE.md"));
                healthList.add(new HealthItemDto(
                        "license", "Open-source license", hasLicense ? "pass" : "fail", false,
                        "Permissive license file specifying project rights",
                        new HealthActionDto("Add license", "https://github.com/" + repo.getFullName() + "/new/" + repo.getDefaultBranch() + "?filename=LICENSE")
                ));

                // 3. .env.example
                boolean hasEnvExample = treeFiles.stream().anyMatch(f -> f.endsWith(".env.example") || f.endsWith(".env.sample"));
                healthList.add(new HealthItemDto(
                        "env_example", "Environment template (.env.example)", hasEnvExample ? "pass" : "fail", false,
                        "Sample environment file without live secret credentials",
                        new HealthActionDto("Add template", "https://github.com/" + repo.getFullName() + "/new/" + repo.getDefaultBranch() + "?filename=.env.example")
                ));

                // 4. tests folder
                boolean hasTests = treeFiles.stream().anyMatch(f -> {
                    String low = f.toLowerCase();
                    return low.startsWith("test/") || low.startsWith("tests/") || low.contains("/test/") || low.contains("/tests/") || low.contains("__tests__") || low.contains("src/test/");
                });
                healthList.add(new HealthItemDto(
                        "tests_folder", "Tests folder and suites", hasTests ? "pass" : "fail", false,
                        "Automated test suites or unit tests in test/ directory",
                        new HealthActionDto("Add tests", "https://github.com/" + repo.getFullName() + "/tree/" + repo.getDefaultBranch())
                ));

                // 5. CI workflow
                boolean hasCi = treeFiles.stream().anyMatch(f -> f.startsWith(".github/workflows/") || f.startsWith(".circleci/") || f.startsWith(".travis.yml"));
                healthList.add(new HealthItemDto(
                        "ci_workflow", "CI workflow automation", hasCi ? "pass" : "fail", false,
                        "Continuous integration GitHub Actions workflow",
                        new HealthActionDto("Add workflow", "https://github.com/" + repo.getFullName() + "/actions/new")
                ));

                return healthList;
            }, githubExecutor);

            List<HealthItemDto> list = future.get(8, TimeUnit.SECONDS);
            SectionResponse<List<HealthItemDto>> resp = SectionResponse.ready(list);
            putCache(roomId, "health", resp, client.getRateLimitRemaining());
            return resp;
        } catch (Exception e) {
            log.warn("Health section fetch failed: {}", e.getMessage());
            return cached != null
                    ? SectionResponse.partial(cached.response.data(), "GitHub is slow right now", "Showing saved data")
                    : SectionResponse.error("GitHub is slow right now. Retry, or open the repository on GitHub.");
        }
    }

    /**
     * Disconnects repository and cascades deletion of branches, commits, health items, freeze and dismissals.
     */
    @Transactional
    public void disconnect(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireLeader(roomId, user);

        repoRepository.deleteById(roomId);
        branchRepository.deleteByRoomId(roomId);
        commitRepository.deleteByRoomId(roomId);
        healthRepository.deleteByRoomId(roomId);
        frozenRepository.deleteById(roomId);
        dismissalRepository.deleteByRoomId(roomId);

        activityLogger.log(room, user, "GITHUB_DISCONNECTED", "Disconnected GitHub repository");
    }

    /**
     * Synchronizes repository state with GitHub, enforcing a 10-second guard between manual sync requests.
     */
    @Transactional
    public GithubPageResponse sync(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        GithubRepo repo = repoRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("REPO_NOT_FOUND", "No repository connected"));

        Instant now = clock.instant();
        if (repo.getLastSyncAt() != null && Duration.between(repo.getLastSyncAt(), now).toSeconds() < 10) {
            throw new TooManyRequestsException("SYNC_TOO_SOON", "Repository was synced recently. Please wait a few seconds.");
        }

        syncService.sync(room, user.getId());
        return getPage(roomId, user);
    }

    /**
     * Updates branch annotations: purpose, role, and owner. Prevents multiple demo-safe branches without replace flag.
     */
    @Transactional
    public BranchDto updateBranch(UUID roomId, UUID branchId, UpdateBranchRequest request, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        RoomMember member = roomAccess.requireMember(roomId, user);

        GithubBranch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new NotFoundException("BRANCH_NOT_FOUND", "Branch not found"));

        if (!branch.getRoomId().equals(roomId)) {
            throw new ForbiddenException("FORBIDDEN", "Branch belongs to another room");
        }

        boolean isLeader = "LEADER".equalsIgnoreCase(member.getRole());
        boolean isOwner = branch.getOwnerUserId() != null && branch.getOwnerUserId().equals(user.getId());

        // Any member may update purpose; role and owner require leader or branch owner
        if (request.purpose() != null) {
            String p = request.purpose().trim();
            branch.setPurpose(p.length() > 140 ? p.substring(0, 140) : p);
        }

        if (request.role() != null) {
            if (!isLeader && !isOwner) {
                throw new ForbiddenException("FORBIDDEN", "Only leader or branch owner can change branch role");
            }
            String rawRole = request.role().trim();
            String targetRole;
            if ("demo-safe".equalsIgnoreCase(rawRole) || "DEMO_SAFE".equalsIgnoreCase(rawRole)) {
                targetRole = "DEMO_SAFE";
                List<GithubBranch> otherDemo = branchRepository.findByRoomIdAndRole(roomId, "demo-safe");
                otherDemo.addAll(branchRepository.findByRoomIdAndRole(roomId, "DEMO_SAFE"));
                for (GithubBranch other : otherDemo) {
                    if (!other.getId().equals(branchId)) {
                        other.setRole("normal");
                        branchRepository.save(other);
                    }
                }
            } else if ("main".equalsIgnoreCase(rawRole) || "MAIN".equalsIgnoreCase(rawRole)) {
                targetRole = "MAIN";
            } else {
                targetRole = "normal";
            }
            branch.setRole(targetRole);
            branch.setRoleLocked(true);
        }

        if (request.ownerId() != null) {
            if (!isLeader && !isOwner) {
                throw new ForbiddenException("FORBIDDEN", "Only leader or branch owner can assign branch owner");
            }
            branch.setOwnerUserId(request.ownerId());
        }

        branch.setUpdatedAt(clock.instant());
        GithubBranch saved = branchRepository.save(branch);
        return mapBranch(saved, roomId);
    }

    /**
     * Replaces the tasks linked to a specific branch.
     */
    @Transactional
    public BranchDto linkBranchTasks(UUID roomId, UUID branchId, LinkBranchTasksRequest request, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        GithubBranch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new NotFoundException("BRANCH_NOT_FOUND", "Branch not found"));

        branchTaskRepository.deleteByBranchId(branchId);
        if (request.taskIds() != null) {
            for (UUID taskId : request.taskIds()) {
                taskRepository.findById(taskId).ifPresent(t -> {
                    if (t.getRoomId().equals(roomId)) {
                        branchTaskRepository.save(new GithubBranchTask(branchId, taskId));
                    }
                });
            }
        }
        return mapBranch(branch, roomId);
    }

    /**
     * Performs SSRF-safe HEAD/GET validation of a deployed URL and saves it to repository record.
     */
    @Transactional
    public DeployedLinkResponse updateDeployedLink(UUID roomId, DeployedLinkRequest request, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        GithubRepo repo = repoRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("REPO_NOT_FOUND", "No repository connected"));

        String url = request.url() != null ? request.url().trim() : null;
        repo.setDeployedLink(url);
        repoRepository.save(repo);

        if (url == null || url.isBlank()) {
            return new DeployedLinkResponse(false, 0);
        }

        SafeHttpClient.SafeHttpResponse res = safeHttpClient.headOrGet(url, 5000);
        return new DeployedLinkResponse(res.ok(), res.httpStatus());
    }

    /**
     * Freezes a demo branch at a specific commit tag, records freeze details, and alerts team members.
     */
    @Transactional
    public FreezeResponse freezeDemo(UUID roomId, FreezeRequest request, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireLeader(roomId, user);

        GithubRepo repo = repoRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("REPO_NOT_FOUND", "No repository connected"));

        GithubBranch branch = branchRepository.findById(request.branchId())
                .orElseThrow(() -> new NotFoundException("BRANCH_NOT_FOUND", "Branch not found"));

        if (branch.getLastCommitSha() == null) {
            throw new BadRequestException("NO_COMMIT", "Branch has no commit sha to freeze");
        }

        validateTag(request.tag());

        GithubFrozenDemo frozen = new GithubFrozenDemo(
                roomId, branch.getName(), branch.getLastCommitSha(),
                branch.getLastCommitMessage(), request.tag().trim(),
                clock.instant(), user.getId(), 0
        );
        frozenRepository.save(frozen);

        notificationService.notifyRoomMembers(room, user, NotificationType.DEMO_FROZEN,
                "Demo frozen", "Demo frozen on branch '" + branch.getName() + "' at tag " + request.tag());

        activityLogger.log(room, user, "DEMO_FROZEN", "Demo frozen on branch " + branch.getName() + " with tag " + request.tag());

        String tagUrl = "https://github.com/" + repo.getFullName() + "/releases/new?tag=" +
                request.tag().trim() + "&target=" + branch.getLastCommitSha();

        FrozenDemoDto dto = new FrozenDemoDto(frozen.getBranchName(), frozen.getTag(), frozen.getSha(), frozen.getFrozenAt(), 0);
        return new FreezeResponse(dto, tagUrl);
    }

    /**
     * Builds the pre-freeze verification checklist shown in the Freeze Demo dialog.
     */
    @Transactional(readOnly = true)
    public FreezeChecklistResponse getFreezeChecklist(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        GithubRepo repo = repoRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("REPO_NOT_FOUND", "No repository connected"));

        Optional<GithubBranch> demoBranch = branchRepository.findByRoomIdAndRole(roomId, "demo-safe").stream().findFirst();
        String branchHead = demoBranch.map(GithubBranch::getName).orElse(repo.getDefaultBranch());

        List<FreezeCheck> checks = new ArrayList<>();
        boolean hasReadme = healthRepository.findByRoomIdAndItemKey(roomId, "readme")
                .map(h -> "pass".equalsIgnoreCase(h.getStatus())).orElse(false);
        checks.add(new FreezeCheck("README setup and run instructions present", hasReadme, "Ensures judges can run the code"));

        boolean noSecrets = healthRepository.findByRoomIdAndItemKey(roomId, "no_secret_files")
                .map(h -> "pass".equalsIgnoreCase(h.getStatus())).orElse(false);
        checks.add(new FreezeCheck("No committed secret credentials or .env files", noSecrets, "Checked file names for .env files, keys and credentials"));

        boolean notBehind = demoBranch.map(b -> b.getBehind() == 0).orElse(true);
        checks.add(new FreezeCheck("Demo branch not behind main branch", notBehind, "Contains all merged master commits"));

        boolean deployedOk = healthRepository.findByRoomIdAndItemKey(roomId, "deployed_link")
                .map(h -> "pass".equalsIgnoreCase(h.getStatus())).orElse(false);
        checks.add(new FreezeCheck("Deployed demonstration link responds OK", deployedOk, "Validates live HTTP access"));

        return new FreezeChecklistResponse(branchHead, checks);
    }

    /**
     * Dismisses a repository attention item for the calling user.
     */
    @Transactional
    public void dismissAttention(UUID roomId, String itemKey, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        dismissalRepository.save(new GithubAttentionDismissal(roomId, itemKey, user.getId(), clock.instant()));
    }

    @Transactional
    public void saveLinkedToken(UUID userId, String accessToken, String scope, String githubLogin) {
        String encryptedToken = secretCipher.encrypt(accessToken);
        UserOAuthToken token = userOAuthTokenRepository.findByUserIdAndProvider(userId, "GITHUB")
                .orElse(new UserOAuthToken(userId, "GITHUB", encryptedToken, scope, githubLogin, clock.instant()));
        token.setAccessTokenEncrypted(encryptedToken);
        token.setScope(scope);
        token.setGithubLogin(githubLogin);
        token.setUpdatedAt(clock.instant());
        userOAuthTokenRepository.save(token);
    }

    @Transactional(readOnly = true)
    public GitHubStatusDto getLinkStatus(User user) {
        if (user == null || user.getId() == null) {
            return new GitHubStatusDto(false, null, false);
        }
        return userOAuthTokenRepository.findByUserIdAndProvider(user.getId(), "GITHUB")
                .map(t -> new GitHubStatusDto(
                        true,
                        t.getGithubLogin(),
                        t.getScope() != null && t.getScope().contains("repo")
                ))
                .orElse(new GitHubStatusDto(false, null, false));
    }

    @Transactional
    public void disconnectLink(User user) {
        if (user != null && user.getId() != null) {
            userOAuthTokenRepository.deleteByUserIdAndProvider(user.getId(), "GITHUB");
        }
    }

    /**
     * Lists up to 100 repositories accessible with the caller's stored GitHub OAuth token, with optional search filter.
     */
    @Transactional(readOnly = true)
    public List<MyRepoDto> getMyRepos(User user, String search) {
        if (user == null || user.getId() == null) {
            throw new BadRequestException("NO_GITHUB_TOKEN", "No GitHub account connected. Please sign in with GitHub.");
        }
        GitHubClientResolver.ResolvedToken token = clientResolver.resolveToken(user.getId());
        if (token.token() == null || !"user".equals(token.source())) {
            throw new BadRequestException("NO_GITHUB_TOKEN", "No GitHub account connected. Please sign in with GitHub.");
        }

        GitHubClient client = clientResolver.resolveClient("");
        List<GitHubClient.UserRepo> repos = client.listUserRepos(token.token());
        List<MyRepoDto> dtos = new ArrayList<>();
        String query = search != null ? search.trim().toLowerCase() : "";
        for (GitHubClient.UserRepo r : repos) {
            if (query.isEmpty() || r.fullName().toLowerCase().contains(query)) {
                dtos.add(new MyRepoDto(r.fullName(), r.isPrivate(), r.updatedAt()));
            }
        }
        return dtos;
    }

    @Transactional(readOnly = true)
    public List<MyRepoDto> getMyRepos(User user) {
        return getMyRepos(user, null);
    }

    private GithubPageResponse buildPageResponse(Room room, GithubRepo repo, User user, boolean isLeader) {
        Instant now = clock.instant();
        Instant kickoff = room.getEventStart() != null ? room.getEventStart() : now.minus(Duration.ofHours(24));

        RepoSummaryDto repoDto = new RepoSummaryDto(
                repo.getFullName(), repo.getUrl(), repo.getVisibility(), repo.getAccess(),
                repo.getLastSyncAt(), repo.getSyncStatus(), repo.getSyncError(),
                repo.getDefaultBranch() != null ? repo.getDefaultBranch() : "main",
                true
        );

        List<GithubCommit> commits = commitRepository.findByRoomIdOrderByCommittedAtDesc(room.getId());
        List<GithubHealthItem> healthItems = healthRepository.findByRoomIdOrderByItemKeyAsc(room.getId());
        List<GithubBranch> rawBranches = branchRepository.findByRoomId(room.getId());

        // Calculators
        long preKickoffCount = commitRepository.countByRoomIdAndCommittedAtBefore(room.getId(), kickoff);
        RuleCheckCalculator.RuleCheckResult ruleRes = RuleCheckCalculator.calculate((int) preKickoffCount);
        HistoryHealthCalculator.HistoryHealthResult histRes = HistoryHealthCalculator.calculate(commits, kickoff, now);
        ReadinessBandCalculator.ReadinessBandResult bandRes = ReadinessBandCalculator.calculate(healthItems);

        Optional<GithubFrozenDemo> frozenOpt = frozenRepository.findById(room.getId());
        BandDemoDto demoBand = frozenOpt.map(f -> new BandDemoDto(
                "frozen", f.getBranchName(), f.getTag(), f.getSha(), f.getFrozenAt(), f.getCommitsSince()
        )).orElse(new BandDemoDto("not-frozen", null, null, null, null, 0));

        ReadinessBandDto band = new ReadinessBandDto(
                new BandScoreDto(bandRes.passed(), bandRes.total()),
                bandRes.headline(),
                bandRes.subline(),
                new BandRulesDto(ruleRes.status(), ruleRes.preKickoffCount(), ruleRes.message()),
                new BandHistoryDto(histRes.status(), histRes.label(), histRes.commitCount(), histRes.contributorCount(), histRes.sparkline()),
                demoBand,
                new BandHealthDto(bandRes.passed(), bandRes.total(), bandRes.missingLabels())
        );

        // Map branches
        List<BranchDto> branchDtos = new ArrayList<>();
        for (GithubBranch b : rawBranches) {
            branchDtos.add(mapBranch(b, room.getId()));
        }

        // Map health
        List<HealthItemDto> healthDtos = new ArrayList<>();
        for (GithubHealthItem h : healthItems) {
            HealthActionDto act = h.getActionLabel() != null ? new HealthActionDto(h.getActionLabel(), h.getActionUrl()) : null;
            healthDtos.add(new HealthItemDto(h.getItemKey(), h.getLabel(), h.getStatus(), h.isRequired(), h.getDetail(), act));
        }

        // Attention items with dismissals applied
        UUID userId = user != null ? user.getId() : null;
        List<AttentionDto> attentionDtos = buildAttentionItems(room, userId, rawBranches, healthItems, frozenOpt.orElse(null), preKickoffCount);

        // Activity buckets
        ActivityBucketsCalculator.ActivityResult actRes = ActivityBucketsCalculator.calculate(commits, kickoff, null, now);

        // Contributors
        List<ContributorDto> contributors = buildContributors(commits);

        FrozenDemoDto frozenDto = frozenOpt.map(f -> new FrozenDemoDto(
                f.getBranchName(), f.getTag(), f.getSha(), f.getFrozenAt(), f.getCommitsSince()
        )).orElse(null);

        boolean tokenAvailable = userId != null && clientResolver.resolveToken(userId).token() != null;

        return new GithubPageResponse(
                true, repoDto, band, branchDtos, healthDtos, attentionDtos,
                actRes, contributors, histRes.busFactorWarning(), frozenDto,
                repo.getDeployedLink(), new PermissionsDto(isLeader, isLeader, isLeader),
                now, isLeader, tokenAvailable
        );
    }

    private BranchDto mapBranch(GithubBranch b, UUID roomId) {
        BranchOwnerDto owner = b.getOwnerUserId() != null
                ? userRepository.findById(b.getOwnerUserId())
                        .map(u -> new BranchOwnerDto(u.getId(), u.getName(), u.getAvatarUrl()))
                        .orElse(null)
                : null;

        BranchPrDto pr = null;
        if (b.getPrNumber() != null) {
            pr = new BranchPrDto(b.getPrNumber(), b.getPrTitle(), b.getPrStatus(), b.isPrConflicts(), b.getPrOpenedAt(), b.getPrReviewerCount());
        }

        List<GithubBranchTask> bTasks = branchTaskRepository.findByBranchId(b.getId());
        List<LinkedTaskDto> linked = new ArrayList<>();
        for (GithubBranchTask bt : bTasks) {
            taskRepository.findById(bt.getTaskId()).ifPresent(t ->
                    linked.add(new LinkedTaskDto(t.getId(), t.getTaskKey(), t.getSummary())));
        }

        List<BranchMissingCalculator.MissingItem> missingItems = BranchMissingCalculator.calculate(b, !linked.isEmpty(), clock.instant());
        List<BranchMissingDto> missingDtos = new ArrayList<>();
        for (BranchMissingCalculator.MissingItem m : missingItems) {
            missingDtos.add(new BranchMissingDto(m.code(), m.label(), m.actionLabel(), m.actionUrl()));
        }

        List<GithubCommit> bCommits = commitRepository.findByRoomIdOrderByCommittedAtDesc(roomId);
        List<RecentCommitDto> recentCommits = new ArrayList<>();
        for (GithubCommit c : bCommits) {
            if (recentCommits.size() < 3) {
                recentCommits.add(new RecentCommitDto(c.getSha(), c.getMessage(), c.getCommittedAt(), c.getAuthorName()));
            }
        }

        return new BranchDto(
                b.getId(), b.getName(), b.getPurpose(), b.getRole(), owner,
                b.getAhead(), b.getBehind(), b.getLastCommitAt(), b.getLastCommitSha(),
                b.getLastCommitMessage(), pr, linked, missingDtos, recentCommits, b.getUrl()
        );
    }

    private List<AttentionDto> buildAttentionItems(Room room, UUID userId, List<GithubBranch> branches,
                                                  List<GithubHealthItem> health, GithubFrozenDemo frozen, long preKickoffCount) {
        List<GithubAttentionDismissal> dismissals = userId != null
                ? dismissalRepository.findByRoomIdAndUserId(room.getId(), userId)
                : List.of();
        Set<String> dismissedKeys = new HashSet<>();
        for (GithubAttentionDismissal d : dismissals) {
            dismissedKeys.add(d.getItemKey());
        }

        List<AttentionDto> list = new ArrayList<>();

        if (preKickoffCount > 0 && !dismissedKeys.contains("repo_rules")) {
            list.add(new AttentionDto("repo_rules", "red", "Pre-kickoff commits detected (" + preKickoffCount + ")",
                    "Commits before kickoff risk contest rule disqualification.", "Review commits", null, "/app/room/" + room.getId() + "/github"));
        }

        for (GithubBranch b : branches) {
            if ("demo-safe".equalsIgnoreCase(b.getRole()) && b.getBehind() > 0 && !dismissedKeys.contains("demo_behind")) {
                list.add(new AttentionDto("demo_behind", "amber", "Demo branch behind main",
                        "Branch '" + b.getName() + "' is " + b.getBehind() + " commits behind main.", "Merge main", null, b.getUrl()));
                break;
            }
        }

        for (GithubBranch b : branches) {
            if (b.isPrConflicts() && !dismissedKeys.contains("pr_conflict")) {
                list.add(new AttentionDto("pr_conflict", "red", "Merge conflict on PR #" + b.getPrNumber(),
                        "Branch '" + b.getName() + "' cannot merge automatically.", "Resolve conflicts", null, b.getUrl()));
                break;
            }
        }

        boolean hasDemoBranch = branches.stream().anyMatch(b -> "demo-safe".equalsIgnoreCase(b.getRole()));
        if (!hasDemoBranch && !dismissedKeys.contains("no_demo_branch")) {
            list.add(new AttentionDto("no_demo_branch", "amber", "No demo-safe branch set",
                    "Designate a stable branch to protect your presentation build.", "Set demo branch", null, "/app/room/" + room.getId() + "/github"));
        }

        if (frozen != null && frozen.getCommitsSince() > 0 && !dismissedKeys.contains("demo_drift")) {
            list.add(new AttentionDto("demo_drift", "amber", "Demo frozen commit has drifted (" + frozen.getCommitsSince() + " commits)",
                    "New commits pushed to " + frozen.getBranchName() + " after demo freeze.", "Review drift", null, "/app/room/" + room.getId() + "/github"));
        }

        return list;
    }

    private List<ContributorDto> buildContributors(List<GithubCommit> commits) {
        Map<String, ContributorDto> map = new HashMap<>();
        for (GithubCommit c : commits) {
            String author = c.getAuthorName() != null ? c.getAuthorName() : (c.getAuthorLogin() != null ? c.getAuthorLogin() : "Contributor");
            ContributorDto current = map.get(author);
            int adds = (current != null && current.additions() != null ? current.additions() : 0) + (c.getAdditions() != null ? c.getAdditions() : 0);
            int dels = (current != null && current.deletions() != null ? current.deletions() : 0) + (c.getDeletions() != null ? c.getDeletions() : 0);
            int count = (current != null ? current.commits() : 0) + 1;
            Instant last = current != null && current.lastActiveAt().isAfter(c.getCommittedAt()) ? current.lastActiveAt() : c.getCommittedAt();

            map.put(author, new ContributorDto(author, null, c.getAuthorUserId(), count, adds, dels, last));
        }
        List<ContributorDto> list = new ArrayList<>(map.values());
        list.sort((a, b) -> Integer.compare(b.commits(), a.commits()));
        return list;
    }

    public String parseRepoInput(String input) {
        if (input == null || input.isBlank()) {
            throw new BadRequestException("INVALID_REPO", "Repository string is required");
        }
        String s = input.trim();
        int qIdx = s.indexOf('?');
        if (qIdx != -1) {
            s = s.substring(0, qIdx);
        }
        int hIdx = s.indexOf('#');
        if (hIdx != -1) {
            s = s.substring(0, hIdx);
        }
        s = s.trim();

        if (s.startsWith("git@")) {
            if (!s.startsWith("git@github.com:")) {
                throw new BadRequestException("INVALID_REPO", "Only github.com repositories are accepted");
            }
            s = s.substring("git@github.com:".length());
        } else {
            if (s.toLowerCase().startsWith("http://") || s.toLowerCase().startsWith("https://")) {
                int schemeEnd = s.indexOf("://");
                String rest = s.substring(schemeEnd + 3);
                int slashIdx = rest.indexOf('/');
                String host = slashIdx != -1 ? rest.substring(0, slashIdx) : rest;
                if (!"github.com".equalsIgnoreCase(host) && !"www.github.com".equalsIgnoreCase(host)) {
                    throw new BadRequestException("INVALID_REPO", "Only github.com repositories are accepted");
                }
                s = slashIdx != -1 ? rest.substring(slashIdx + 1) : "";
            } else if (s.toLowerCase().startsWith("github.com/")) {
                s = s.substring("github.com/".length());
            } else if (s.toLowerCase().startsWith("www.github.com/")) {
                s = s.substring("www.github.com/".length());
            } else if (s.contains("://") || (s.contains("/") && s.substring(0, s.indexOf('/')).contains("."))) {
                throw new BadRequestException("INVALID_REPO", "Only github.com repositories are accepted");
            }
        }

        String[] parts = Arrays.stream(s.split("/"))
                .filter(p -> !p.isBlank())
                .toArray(String[]::new);

        if (parts.length < 2) {
            throw new BadRequestException("INVALID_REPO", "Invalid repository. Use 'owner/repo' or https://github.com/owner/repo");
        }

        String owner = parts[0];
        String repo = parts[1];

        if (repo.endsWith(".git")) {
            repo = repo.substring(0, repo.length() - 4);
        }

        Pattern namePattern = Pattern.compile("^[A-Za-z0-9_.-]+$");
        if (!namePattern.matcher(owner).matches() || !namePattern.matcher(repo).matches() || repo.isEmpty() || owner.isEmpty()) {
            throw new BadRequestException("INVALID_REPO", "Invalid repository name or owner");
        }

        return owner + "/" + repo;
    }

    private void validateTag(String tag) {
        if (tag == null || !TAG_PATTERN.matcher(tag.trim()).matches()
                || tag.contains("..") || tag.startsWith("-") || tag.endsWith(".lock")) {
            throw new BadRequestException("INVALID_TAG", "Tag must be 1-60 characters and cannot contain '..', start with '-' or end in '.lock'");
        }
    }

    @Transactional(readOnly = true)
    public List<GithubCheckDto> getChecks(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);
        GithubRepo repo = repoRepository.findById(roomId).orElse(null);
        if (repo == null) {
            return Collections.emptyList();
        }

        List<GithubCheckDto> checks = new ArrayList<>();
        List<GithubCommit> commits = commitRepository.findByRoomIdOrderByCommittedAtDesc(roomId);
        List<GithubHealthItem> healthItems = healthRepository.findByRoomIdOrderByItemKeyAsc(roomId);
        Map<String, GithubHealthItem> healthMap = healthItems.stream().collect(Collectors.toMap(GithubHealthItem::getItemKey, h -> h, (a, b) -> a));

        // 1. AFTER_KICKOFF
        Instant kickoff = room.getEventStart();
        if (kickoff == null) {
            checks.add(new GithubCheckDto("AFTER_KICKOFF", "Commits after kickoff", "PASS", "All commits pushed after hackathon start", null, null));
        } else {
            List<GithubCommit> preKickoff = commits.stream()
                    .filter(c -> c.getCommittedAt() != null && c.getCommittedAt().isBefore(kickoff))
                    .toList();
            if (preKickoff.isEmpty()) {
                checks.add(new GithubCheckDto("AFTER_KICKOFF", "Commits after kickoff", "PASS", "All commits pushed after hackathon start (" + kickoff + ")", null, null));
            } else {
                boolean strictDisqualify = briefRepository.findByRoomId(roomId)
                        .map(b -> {
                            String t = ((b.getTechRules() != null ? b.getTechRules() : "") + " " + (b.getRawText() != null ? b.getRawText() : "")).toLowerCase();
                            return t.contains("fresh") || t.contains("kickoff") || t.contains("pre-existing") || t.contains("disqualif");
                        }).orElse(false);
                String status = strictDisqualify ? "FAIL" : "WARN";
                StringBuilder detail = new StringBuilder(preKickoff.size() + " commit(s) before kickoff. First: ");
                GithubCommit first = preKickoff.get(preKickoff.size() - 1);
                String sha7 = first.getSha() != null ? first.getSha().substring(0, Math.min(7, first.getSha().length())) : "";
                detail.append(sha7).append(" by ").append(first.getAuthorName() != null ? first.getAuthorName() : "Unknown");
                if (first.getMessage() != null) {
                    detail.append(" (").append(first.getMessage().length() > 50 ? first.getMessage().substring(0, 50) + "..." : first.getMessage()).append(")");
                }
                checks.add(new GithubCheckDto("AFTER_KICKOFF", "Commits after kickoff", status, detail.toString(), repo.getUrl() + "/commits", "Review commits"));
            }
        }

        // 2. README
        GithubHealthItem readmeHealth = healthMap.get("readme");
        boolean hasReadme = readmeHealth != null && "pass".equalsIgnoreCase(readmeHealth.getStatus());
        if (hasReadme) {
            checks.add(new GithubCheckDto("README", "README setup & run instructions", "PASS", "README present with setup instructions", "https://github.com/" + repo.getFullName() + "/blob/" + repo.getDefaultBranch() + "/README.md", "View README"));
        } else {
            checks.add(new GithubCheckDto("README", "README setup & run instructions", "FAIL", "README is missing or lacks setup instructions for judges", "https://github.com/" + repo.getFullName() + "/new/" + repo.getDefaultBranch() + "?filename=README.md", "Create README"));
        }

        // 3. ENV_EXAMPLE
        GithubHealthItem envHealth = healthMap.get("env_example");
        GithubHealthItem secretsHealth = healthMap.get("no_secret_files");
        boolean secretsFailed = secretsHealth != null && "fail".equalsIgnoreCase(secretsHealth.getStatus());
        boolean hasEnvExample = envHealth != null && "pass".equalsIgnoreCase(envHealth.getStatus());
        if (secretsFailed) {
            checks.add(new GithubCheckDto("ENV_EXAMPLE", "Environment template & secret hygiene", "FAIL", "Committed secret files detected (.env, credentials, or private keys)", repo.getUrl(), "Review repository"));
        } else if (hasEnvExample) {
            checks.add(new GithubCheckDto("ENV_EXAMPLE", "Environment template & secret hygiene", "PASS", ".env.example is present and no secrets committed", null, null));
        } else {
            checks.add(new GithubCheckDto("ENV_EXAMPLE", "Environment template & secret hygiene", "WARN", ".env.example is recommended to help judges configure environment variables", "https://github.com/" + repo.getFullName() + "/new/" + repo.getDefaultBranch() + "?filename=.env.example", "Add .env.example"));
        }

        // 4. LICENSE
        GithubHealthItem licenseHealth = healthMap.get("license");
        boolean hasLicense = licenseHealth != null && "pass".equalsIgnoreCase(licenseHealth.getStatus());
        if (hasLicense) {
            checks.add(new GithubCheckDto("LICENSE", "Open source license", "PASS", "License file present", null, null));
        } else {
            boolean osRequired = briefRepository.findByRoomId(roomId)
                    .map(b -> {
                        String t = ((b.getTechRules() != null ? b.getTechRules() : "") + " " + (b.getRawText() != null ? b.getRawText() : "")).toLowerCase();
                        return t.contains("open source") || t.contains("mit license") || t.contains("apache");
                    }).orElse(false);
            checks.add(new GithubCheckDto("LICENSE", "Open source license", osRequired ? "FAIL" : "WARN", osRequired ? "Open source license required by hackathon rules" : "Open source license recommended for hackathon submissions", "https://github.com/" + repo.getFullName() + "/new/" + repo.getDefaultBranch() + "?filename=LICENSE", "Add LICENSE"));
        }

        // 5. TESTS_OR_CI
        GithubHealthItem testsHealth = healthMap.get("tests_folder");
        GithubHealthItem ciHealth = healthMap.get("ci_workflow");
        boolean hasTests = testsHealth != null && "pass".equalsIgnoreCase(testsHealth.getStatus());
        boolean hasCi = ciHealth != null && "pass".equalsIgnoreCase(ciHealth.getStatus());
        if (hasTests || hasCi) {
            checks.add(new GithubCheckDto("TESTS_OR_CI", "Tests and CI workflows", "PASS", "Automated tests or continuous integration workflow found", null, null));
        } else {
            checks.add(new GithubCheckDto("TESTS_OR_CI", "Tests and CI workflows", "WARN", "No test suites or CI workflows detected", "https://github.com/" + repo.getFullName() + "/actions/new", "Add workflow"));
        }

        // 6. DEMO_MARKED
        Optional<RoomGithubDemo> demoOpt = roomGithubDemoRepository.findById(roomId);
        if (demoOpt.isPresent()) {
            RoomGithubDemo demo = demoOpt.get();
            String sha7 = demo.getSha().substring(0, Math.min(7, demo.getSha().length()));
            checks.add(new GithubCheckDto("DEMO_MARKED", "Demo commit marked", "PASS", "Marked on branch " + demo.getBranch() + " (" + sha7 + ")", null, null));
        } else {
            boolean isFrozen = "FROZEN".equalsIgnoreCase(room.getStage()) || "freeze".equalsIgnoreCase(room.getStage());
            checks.add(new GithubCheckDto("DEMO_MARKED", "Demo commit marked", isFrozen ? "FAIL" : "WARN", isFrozen ? "Room is in Freeze phase but no demo build commit has been marked" : "Mark the commit you will demo before final submission", null, "Mark demo commit"));
        }

        // 7. DEPLOYED_LINK
        String deployedLink = repo.getDeployedLink();
        if (deployedLink != null && !deployedLink.isBlank()) {
            checks.add(new GithubCheckDto("DEPLOYED_LINK", "Deployed demo link", "PASS", "Live URL verified: " + deployedLink, deployedLink, "Open link"));
        } else {
            checks.add(new GithubCheckDto("DEPLOYED_LINK", "Deployed demo link", "WARN", "No live deployed link configured", null, "Add link"));
        }

        // 8. TEAM_COMMITS
        List<RoomMember> members = roomMemberRepository.findByRoomId(roomId);
        int unlinkedCount = 0;
        int zeroCommitCount = 0;
        List<String> unlinkedNames = new ArrayList<>();
        for (RoomMember m : members) {
            User u = userRepository.findById(m.getUserId()).orElse(null);
            Optional<UserOAuthToken> tok = userOAuthTokenRepository.findByUserIdAndProvider(m.getUserId(), "GITHUB");
            if (tok.isEmpty() || tok.get().getGithubLogin() == null) {
                unlinkedCount++;
                unlinkedNames.add(u != null ? u.getName() : "Member");
            } else {
                String ghLogin = tok.get().getGithubLogin();
                long userCommits = commits.stream().filter(c -> c.getAuthorLogin() != null && c.getAuthorLogin().equalsIgnoreCase(ghLogin)).count();
                if (userCommits == 0) {
                    zeroCommitCount++;
                }
            }
        }
        if (unlinkedCount > 0) {
            checks.add(new GithubCheckDto("TEAM_COMMITS", "Team member commits", "UNKNOWN", unlinkedCount + " member(s) haven't connected GitHub in Settings (" + String.join(", ", unlinkedNames) + ")", "/app/settings/integrations", "Connect GitHub"));
        } else if (zeroCommitCount > 0) {
            checks.add(new GithubCheckDto("TEAM_COMMITS", "Team member commits", "WARN", zeroCommitCount + " team member(s) have 0 commits in the repository", null, null));
        } else {
            checks.add(new GithubCheckDto("TEAM_COMMITS", "Team member commits", "PASS", "All team members have pushed commits to the repository", null, null));
        }

        return checks;
    }

    @Transactional(readOnly = true)
    public GithubContributorsResponse getContributors(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        Instant now = clock.instant();
        Instant sevenDaysAgo = now.minus(Duration.ofDays(7));
        List<GithubCommit> commits = commitRepository.findByRoomIdOrderByCommittedAtDesc(roomId);
        List<RoomMember> members = roomMemberRepository.findByRoomId(roomId);

        Set<String> memberLogins = new HashSet<>();
        List<GithubContributorItemDto> memberDtos = new ArrayList<>();

        for (RoomMember m : members) {
            User u = userRepository.findById(m.getUserId()).orElse(null);
            Optional<UserOAuthToken> tok = userOAuthTokenRepository.findByUserIdAndProvider(m.getUserId(), "GITHUB");
            String ghLogin = tok.map(UserOAuthToken::getGithubLogin).orElse(null);
            if (ghLogin != null && !ghLogin.isBlank()) {
                memberLogins.add(ghLogin.toLowerCase());
                List<GithubCommit> memberCommits = commits.stream()
                        .filter(c -> c.getAuthorLogin() != null && c.getAuthorLogin().equalsIgnoreCase(ghLogin))
                        .toList();
                int commits7 = (int) memberCommits.stream().filter(c -> c.getCommittedAt() != null && c.getCommittedAt().isAfter(sevenDaysAgo)).count();
                Instant lastCommit = memberCommits.stream().map(GithubCommit::getCommittedAt).filter(Objects::nonNull).max(Instant::compareTo).orElse(null);
                memberDtos.add(new GithubContributorItemDto(
                        m.getUserId(),
                        u != null ? u.getUsername() : null,
                        u != null ? u.getName() : "Member",
                        u != null ? u.getAvatarUrl() : null,
                        ghLogin,
                        commits7,
                        0,
                        0,
                        lastCommit,
                        true
                ));
            } else {
                memberDtos.add(new GithubContributorItemDto(
                        m.getUserId(),
                        u != null ? u.getUsername() : null,
                        u != null ? u.getName() : "Member",
                        u != null ? u.getAvatarUrl() : null,
                        null,
                        0,
                        0,
                        0,
                        null,
                        true
                ));
            }
        }

        Map<String, List<GithubCommit>> otherCommitsByAuthor = new HashMap<>();
        for (GithubCommit c : commits) {
            String author = c.getAuthorLogin();
            if (author == null || author.isBlank()) {
                author = c.getAuthorName();
            }
            if (author != null && !memberLogins.contains(author.toLowerCase())) {
                otherCommitsByAuthor.computeIfAbsent(author, k -> new ArrayList<>()).add(c);
            }
        }

        List<GithubContributorItemDto> otherDtos = new ArrayList<>();
        for (Map.Entry<String, List<GithubCommit>> entry : otherCommitsByAuthor.entrySet()) {
            List<GithubCommit> cList = entry.getValue();
            int commits7 = (int) cList.stream().filter(c -> c.getCommittedAt() != null && c.getCommittedAt().isAfter(sevenDaysAgo)).count();
            Instant lastCommit = cList.stream().map(GithubCommit::getCommittedAt).filter(Objects::nonNull).max(Instant::compareTo).orElse(null);
            otherDtos.add(new GithubContributorItemDto(
                    null,
                    entry.getKey(),
                    entry.getKey(),
                    null,
                    entry.getKey(),
                    commits7,
                    0,
                    0,
                    lastCommit,
                    false
            ));
        }

        return new GithubContributorsResponse(memberDtos, otherDtos);
    }

    @Transactional(readOnly = true)
    public GithubTaskLinksResponse getTaskLinks(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);
        GithubRepo repo = repoRepository.findById(roomId).orElse(null);
        if (repo == null) {
            return new GithubTaskLinksResponse(0, 0, "No repository connected", Collections.emptyList());
        }

        String prefix = room.getKeyPrefix() != null && !room.getKeyPrefix().isBlank() ? room.getKeyPrefix() : "TASK";
        Pattern pattern = Pattern.compile("(?i)\\b" + Pattern.quote(prefix) + "-(\\d+)\\b");

        List<GithubCommit> commits = commitRepository.findByRoomIdOrderByCommittedAtDesc(roomId);
        List<GithubBranch> branches = branchRepository.findByRoomId(roomId);

        Map<String, List<TaskCommitLinkDto>> taskCommits = new HashMap<>();
        Set<String> matchedCommits = new HashSet<>();

        for (GithubCommit c : commits) {
            if (c.getMessage() == null) continue;
            Matcher m = pattern.matcher(c.getMessage());
            boolean matched = false;
            while (m.find()) {
                matched = true;
                String taskKey = m.group(0).toUpperCase();
                String url = repo.getUrl() + "/commit/" + c.getSha();
                taskCommits.computeIfAbsent(taskKey, k -> new ArrayList<>())
                        .add(new TaskCommitLinkDto(c.getSha(), c.getMessage(), c.getAuthorName(), c.getCommittedAt(), url));
            }
            if (matched) {
                matchedCommits.add(c.getSha());
            }
        }

        Map<String, List<TaskBranchLinkDto>> taskBranches = new HashMap<>();
        for (GithubBranch b : branches) {
            Matcher m = pattern.matcher(b.getName());
            while (m.find()) {
                String taskKey = m.group(0).toUpperCase();
                taskBranches.computeIfAbsent(taskKey, k -> new ArrayList<>())
                        .add(new TaskBranchLinkDto(b.getName(), b.getUrl()));
            }
        }

        Set<String> allKeys = new TreeSet<>();
        allKeys.addAll(taskCommits.keySet());
        allKeys.addAll(taskBranches.keySet());

        List<TaskLinksItemDto> items = new ArrayList<>();
        for (String k : allKeys) {
            items.add(new TaskLinksItemDto(
                    k,
                    taskCommits.getOrDefault(k, Collections.emptyList()),
                    Collections.emptyList(),
                    taskBranches.getOrDefault(k, Collections.emptyList())
            ));
        }

        int totalCommits = commits.size();
        int commitsWithTasks = matchedCommits.size();
        String headerSummary = commitsWithTasks + " of " + totalCommits + " commits reference tasks (" + prefix + "-#)";

        return new GithubTaskLinksResponse(totalCommits, commitsWithTasks, headerSummary, items);
    }

    @Transactional(readOnly = true)
    public DemoMarkerDto getDemoMarker(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        return roomGithubDemoRepository.findById(roomId).map(demo -> {
            String markedByName = demo.getMarkedBy() != null
                    ? userRepository.findById(demo.getMarkedBy()).map(User::getName).orElse("Team member")
                    : "Team member";
            List<GithubCommit> commits = commitRepository.findByRoomIdOrderByCommittedAtDesc(roomId);
            long moved = commits.stream().filter(c -> c.getCommittedAt() != null && c.getCommittedAt().isAfter(demo.getMarkedAt())).count();
            String sha7 = demo.getSha().substring(0, Math.min(7, demo.getSha().length()));
            String summary = demo.getBranch() + " @ " + sha7 + " (" + moved + " commits since marked)";
            return new DemoMarkerDto(demo.getBranch(), demo.getSha(), demo.getMarkedBy(), markedByName, demo.getMarkedAt(), (int) moved, summary);
        }).orElse(null);
    }

    @Transactional
    public DemoMarkerDto saveDemoMarker(UUID roomId, SaveDemoMarkerRequest request, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireLeader(roomId, user);
        GithubRepo repo = repoRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("REPO_NOT_FOUND", "No repository connected"));

        String branchName = request != null && request.branch() != null && !request.branch().isBlank()
                ? request.branch().trim()
                : repo.getDefaultBranch();

        GithubBranch branch = branchRepository.findByRoomIdAndName(roomId, branchName).orElse(null);
        String sha = branch != null && branch.getLastCommitSha() != null ? branch.getLastCommitSha() : null;
        if (sha == null) {
            List<GithubCommit> commits = commitRepository.findByRoomIdOrderByCommittedAtDesc(roomId);
            sha = !commits.isEmpty() ? commits.get(0).getSha() : "0000000";
        }

        RoomGithubDemo demo = new RoomGithubDemo(roomId, branchName, sha, user.getId(), clock.instant());
        roomGithubDemoRepository.save(demo);

        activityLogger.log(room, user, "DEMO_COMMIT_MARKED", "Marked demo build commit on " + branchName + " (" + sha.substring(0, Math.min(7, sha.length())) + ")");
        return getDemoMarker(roomId, user);
    }

    @Transactional
    public void deleteDemoMarker(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireLeader(roomId, user);
        roomGithubDemoRepository.deleteById(roomId);
        activityLogger.log(room, user, "DEMO_COMMIT_CLEARED", "Cleared marked demo commit");
    }
}
