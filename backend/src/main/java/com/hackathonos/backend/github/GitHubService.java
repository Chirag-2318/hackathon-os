package com.hackathonos.backend.github;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.common.error.*;
import com.hackathonos.backend.common.http.SafeHttpClient;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.github.calc.*;
import com.hackathonos.backend.github.client.GitHubClient;
import com.hackathonos.backend.github.client.GitHubClientResolver;
import com.hackathonos.backend.github.dto.GithubDtos.*;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GitHubService {

    private static final Pattern REPO_INPUT_PATTERN = Pattern.compile(
            "^(?:https?:\\/\\/github\\.com\\/)?([A-Za-z0-9_.-]+)\\/([A-Za-z0-9_.-]+?)(?:\\.git)?(?:\\/.*)?$"
    );

    private static final Pattern TAG_PATTERN = Pattern.compile("^[A-Za-z0-9._/-]{1,60}$");

    private final GithubRepoRepository repoRepository;
    private final GithubBranchRepository branchRepository;
    private final GithubBranchTaskRepository branchTaskRepository;
    private final GithubCommitRepository commitRepository;
    private final GithubHealthItemRepository healthRepository;
    private final GithubFrozenDemoRepository frozenRepository;
    private final GithubAttentionDismissalRepository dismissalRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
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
        boolean tokenAvailable = clientResolver.resolveToken(user.getId()).token() != null;

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

    /**
     * Connects a repository to the room, verifies existence on GitHub, runs the first sync, and returns page model.
     */
    @Transactional
    public GithubPageResponse connect(UUID roomId, ConnectRepoRequest request, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireLeader(roomId, user);

        String parsedFullName = parseRepoInput(request.repo());
        String[] parts = parsedFullName.split("/");
        String owner = parts[0];
        String repoName = parts[1];

        GitHubClient client = clientResolver.resolveClient(parsedFullName);
        GitHubClientResolver.ResolvedToken token = clientResolver.resolveToken(user.getId());

        GitHubClient.ClientRepo clientRepo = client.getRepo(owner, repoName, token.token())
                .orElseThrow(() -> new NotFoundException("REPO_NOT_FOUND", "Repository not found or private. Make sure it is public or connect with token."));

        GithubRepo repo = new GithubRepo(
                roomId, clientRepo.fullName(), clientRepo.url(), clientRepo.visibility(),
                clientRepo.defaultBranch(), "read-only", user.getId(), clock.instant(),
                null, "idle", null, null, token.source()
        );
        repoRepository.save(repo);

        // Run first sync
        syncService.sync(room, user.getId());

        activityLogger.log(room, user, "GITHUB_CONNECTED", "Connected repository " + repo.getFullName());
        return getPage(roomId, user);
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
            if ("demo-safe".equalsIgnoreCase(request.role())) {
                List<GithubBranch> otherDemo = branchRepository.findByRoomIdAndRole(roomId, "demo-safe");
                for (GithubBranch other : otherDemo) {
                    if (!other.getId().equals(branchId)) {
                        if (Boolean.TRUE.equals(request.replace())) {
                            other.setRole("experiment");
                            branchRepository.save(other);
                        } else {
                            throw new ConflictException("DEMO_BRANCH_EXISTS", "Another demo-safe branch already exists. Confirm replace to proceed.");
                        }
                    }
                }
            }
            branch.setRole(request.role());
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

    /**
     * Lists up to 100 repositories accessible with the caller's stored GitHub OAuth token.
     */
    @Transactional(readOnly = true)
    public List<MyRepoDto> getMyRepos(User user) {
        GitHubClientResolver.ResolvedToken token = clientResolver.resolveToken(user.getId());
        if (token.token() == null || !"user".equals(token.source())) {
            throw new BadRequestException("NO_GITHUB_TOKEN", "No GitHub account connected. Please sign in with GitHub.");
        }

        GitHubClient client = clientResolver.resolveClient("");
        List<GitHubClient.UserRepo> repos = client.listUserRepos(token.token());
        List<MyRepoDto> dtos = new ArrayList<>();
        for (GitHubClient.UserRepo r : repos) {
            dtos.add(new MyRepoDto(r.fullName(), r.isPrivate(), r.updatedAt()));
        }
        return dtos;
    }

    private GithubPageResponse buildPageResponse(Room room, GithubRepo repo, User user, boolean isLeader) {
        Instant now = clock.instant();
        Instant kickoff = room.getEventStart() != null ? room.getEventStart() : now.minus(Duration.ofHours(24));

        RepoSummaryDto repoDto = new RepoSummaryDto(
                repo.getFullName(), repo.getUrl(), repo.getVisibility(), repo.getAccess(),
                repo.getLastSyncAt(), repo.getSyncStatus(), repo.getSyncError()
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
        List<AttentionDto> attentionDtos = buildAttentionItems(room, user.getId(), rawBranches, healthItems, frozenOpt.orElse(null), preKickoffCount);

        // Activity buckets
        ActivityBucketsCalculator.ActivityResult actRes = ActivityBucketsCalculator.calculate(commits, kickoff, null, now);

        // Contributors
        List<ContributorDto> contributors = buildContributors(commits);

        FrozenDemoDto frozenDto = frozenOpt.map(f -> new FrozenDemoDto(
                f.getBranchName(), f.getTag(), f.getSha(), f.getFrozenAt(), f.getCommitsSince()
        )).orElse(null);

        boolean tokenAvailable = clientResolver.resolveToken(user.getId()).token() != null;

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
        List<GithubAttentionDismissal> dismissals = dismissalRepository.findByRoomIdAndUserId(room.getId(), userId);
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

    private String parseRepoInput(String input) {
        if (input == null || input.isBlank()) {
            throw new BadRequestException("INVALID_REPO", "Repository string is required");
        }
        Matcher matcher = REPO_INPUT_PATTERN.matcher(input.trim());
        if (!matcher.matches()) {
            throw new BadRequestException("INVALID_REPO", "Invalid repository. Use 'owner/repo' or https://github.com/owner/repo");
        }
        return matcher.group(1) + "/" + matcher.group(2);
    }

    private void validateTag(String tag) {
        if (tag == null || !TAG_PATTERN.matcher(tag.trim()).matches()
                || tag.contains("..") || tag.startsWith("-") || tag.endsWith(".lock")) {
            throw new BadRequestException("INVALID_TAG", "Tag must be 1-60 characters and cannot contain '..', start with '-' or end in '.lock'");
        }
    }
}
