package com.hackathonos.backend.github;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.common.http.SafeHttpClient;
import com.hackathonos.backend.github.client.GitHubClient;
import com.hackathonos.backend.github.client.GitHubClientResolver;
import com.hackathonos.backend.github.client.GitHubRateLimitException;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GitHubSyncService {

    private static final Logger log = LoggerFactory.getLogger(GitHubSyncService.class);

    private final GithubRepoRepository repoRepository;
    private final GithubBranchRepository branchRepository;
    private final GithubBranchTaskRepository branchTaskRepository;
    private final GithubCommitRepository commitRepository;
    private final GithubHealthItemRepository healthRepository;
    private final GithubFrozenDemoRepository frozenRepository;
    private final GithubAttentionDismissalRepository dismissalRepository;
    private final TaskRepository taskRepository;
    private final RoomMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final BriefRepository briefRepository;
    private final GitHubClientResolver clientResolver;
    private final SafeHttpClient safeHttpClient;
    private final Clock clock;

    public GitHubSyncService(GithubRepoRepository repoRepository,
                             GithubBranchRepository branchRepository,
                             GithubBranchTaskRepository branchTaskRepository,
                             GithubCommitRepository commitRepository,
                             GithubHealthItemRepository healthRepository,
                             GithubFrozenDemoRepository frozenRepository,
                             GithubAttentionDismissalRepository dismissalRepository,
                             TaskRepository taskRepository,
                             RoomMemberRepository memberRepository,
                             UserRepository userRepository,
                             BriefRepository briefRepository,
                             GitHubClientResolver clientResolver,
                             SafeHttpClient safeHttpClient,
                             Clock clock) {
        this.repoRepository = repoRepository;
        this.branchRepository = branchRepository;
        this.branchTaskRepository = branchTaskRepository;
        this.commitRepository = commitRepository;
        this.healthRepository = healthRepository;
        this.frozenRepository = frozenRepository;
        this.dismissalRepository = dismissalRepository;
        this.taskRepository = taskRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.briefRepository = briefRepository;
        this.clientResolver = clientResolver;
        this.safeHttpClient = safeHttpClient;
        this.clock = clock;
    }

    /**
     * Executes the capped 10-step synchronization for a room's GitHub repository.
     * Keeps old data intact on unexpected errors and updates sync error and timestamps.
     */
    @Transactional
    public void sync(Room room, UUID connectingUserId) {
        GithubRepo repo = repoRepository.findById(room.getId()).orElse(null);
        if (repo == null) return;

        Instant now = clock.instant();
        String[] parts = repo.getFullName().split("/");
        if (parts.length != 2) return;
        String owner = parts[0];
        String repoName = parts[1];

        GitHubClient client = clientResolver.resolveClient(repo.getFullName());
        GitHubClientResolver.ResolvedToken resolvedToken = clientResolver.resolveToken(connectingUserId != null ? connectingUserId : repo.getConnectedBy());
        String token = resolvedToken.token();

        repo.setSyncStatus("running");
        repo.setTokenSource(resolvedToken.source());
        repoRepository.save(repo);

        try {
            // Step 1: Repo info
            syncRepoInfo(client, repo, owner, repoName, token);

            // Step 2 & 3: Branches & Comparison
            List<GithubBranch> branches = syncBranchesAndComparison(client, room, repo, owner, repoName, token, now);

            // Step 4: Pull requests
            syncPullRequests(client, branches, owner, repoName, token);

            // Step 5: Commits (event window & pre-kickoff)
            syncCommits(client, room, repo, owner, repoName, token, now);

            // Step 6: Roles and Owners
            applyRolesAndOwners(branches, now);

            // Step 7: Task linking by key
            autoLinkTasks(room, branches);

            // Step 8: Health items
            syncHealthItems(client, room, repo, owner, repoName, token);

            // Step 9: Frozen demo drift
            syncFrozenDemoDrift(room, branches);

            // Step 10: Finalize
            repo.setLastSyncAt(now);
            repo.setSyncStatus("idle");
            repo.setSyncError(null);
            repoRepository.save(repo);

            cleanupStaleDismissals(room);

        } catch (GitHubRateLimitException rle) {
            repo.setSyncStatus("failed");
            repo.setSyncError("GitHub rate limit reached. Resets at " + rle.getResetAt());
            repoRepository.save(repo);
            throw rle;
        } catch (Exception e) {
            log.error("GitHub sync failed for room {}: {}", room.getId(), e.getMessage(), e);
            repo.setSyncStatus("failed");
            repo.setSyncError("Sync error: " + e.getMessage());
            repoRepository.save(repo);
        }
    }

    private void syncRepoInfo(GitHubClient client, GithubRepo repo, String owner, String repoName, String token) {
        client.getRepo(owner, repoName, token).ifPresent(r -> {
            repo.setVisibility(r.visibility());
            repo.setDefaultBranch(r.defaultBranch());
            repo.setUrl(r.url());
        });
    }

    private List<GithubBranch> syncBranchesAndComparison(GitHubClient client, Room room, GithubRepo repo,
                                                         String owner, String repoName, String token, Instant now) {
        List<GitHubClient.ClientBranch> fetched = client.listBranches(owner, repoName, token);
        List<GithubBranch> existing = branchRepository.findByRoomId(room.getId());
        Map<String, GithubBranch> branchMap = new HashMap<>();
        for (GithubBranch b : existing) {
            branchMap.put(b.getName(), b);
        }

        // Cap to top 40 branches + default + any role-assigned branch
        List<GitHubClient.ClientBranch> prioritized = new ArrayList<>();
        for (GitHubClient.ClientBranch fb : fetched) {
            boolean isDefault = fb.name().equalsIgnoreCase(repo.getDefaultBranch());
            boolean hasStoredRole = branchMap.containsKey(fb.name()) && !"experiment".equalsIgnoreCase(branchMap.get(fb.name()).getRole());
            if (isDefault || hasStoredRole || prioritized.size() < 40) {
                prioritized.add(fb);
            }
        }

        List<GithubBranch> savedBranches = new ArrayList<>();
        int compareCount = 0;

        for (GitHubClient.ClientBranch fb : prioritized) {
            GithubBranch b = branchMap.getOrDefault(fb.name(), new GithubBranch(
                    room.getId(), fb.name(), null, "experiment", false, null,
                    0, 0, fb.sha(), null, null, null, null, null, false, null, 0,
                    "https://github.com/" + repo.getFullName() + "/tree/" + fb.name(), now
            ));
            b.setLastCommitSha(fb.sha());

            // Compare top 10 non-default branches
            if (fb.name().equalsIgnoreCase(repo.getDefaultBranch())) {
                b.setAhead(0);
                b.setBehind(0);
                b.setRole("main");
            } else if (compareCount < 10) {
                GitHubClient.ClientBranchCompare cmp = client.compareBranches(owner, repoName, repo.getDefaultBranch(), fb.name(), token);
                b.setAhead(cmp.aheadBy());
                b.setBehind(cmp.behindBy());
                compareCount++;
            }

            b.setUpdatedAt(now);
            savedBranches.add(branchRepository.save(b));
        }

        return savedBranches;
    }

    private void syncPullRequests(GitHubClient client, List<GithubBranch> branches, String owner, String repoName, String token) {
        List<GitHubClient.ClientPr> prs = client.listPullRequests(owner, repoName, token);
        Map<String, GitHubClient.ClientPr> headMap = new HashMap<>();
        for (GitHubClient.ClientPr pr : prs) {
            if ("open".equalsIgnoreCase(pr.state()) || "draft".equalsIgnoreCase(pr.state())) {
                headMap.put(pr.headBranch(), pr);
            } else if (!headMap.containsKey(pr.headBranch())) {
                headMap.put(pr.headBranch(), pr);
            }
        }

        int detailChecks = 0;
        for (GithubBranch b : branches) {
            GitHubClient.ClientPr pr = headMap.get(b.getName());
            if (pr != null) {
                b.setPrNumber(pr.number());
                b.setPrTitle(pr.title());
                b.setPrOpenedAt(pr.openedAt());

                String status = pr.draft() ? "draft" : pr.state();
                b.setPrStatus(status);

                if (detailChecks < 20 && ("open".equalsIgnoreCase(status) || "draft".equalsIgnoreCase(status))) {
                    GitHubClient.ClientPrDetail detail = client.getPullRequest(owner, repoName, pr.number(), token);
                    b.setPrConflicts(!detail.mergeable());
                    b.setPrReviewerCount(detail.requestedReviewersCount());
                    detailChecks++;
                }
                branchRepository.save(b);
            }
        }
    }

    private void syncCommits(GitHubClient client, Room room, GithubRepo repo, String owner, String repoName, String token, Instant now) {
        Instant kickoff = room.getEventStart() != null ? room.getEventStart() : now.minus(Duration.ofHours(24));
        List<RoomMember> members = memberRepository.findByRoomId(room.getId());
        Map<String, UUID> loginToUserId = buildMemberLookup(members);

        List<GithubBranch> branches = branchRepository.findByRoomId(room.getId());
        List<GithubBranch> topBranches = branches.subList(0, Math.min(15, branches.size()));

        Map<String, GitHubClient.ClientCommit> commitMap = new HashMap<>();
        for (GithubBranch b : topBranches) {
            List<GitHubClient.ClientCommit> fetched = client.listCommits(owner, repoName, b.getName(), kickoff, null, token);
            for (GitHubClient.ClientCommit c : fetched) {
                commitMap.putIfAbsent(c.sha(), c);
            }
        }

        // Fetch pre-kickoff commits count on default branch
        List<GitHubClient.ClientCommit> preKickoff = client.listCommits(owner, repoName, repo.getDefaultBranch(), null, kickoff, token);
        long preKickoffCount = preKickoff.size();

        // Details for 60 newest commits if token exists
        List<GitHubClient.ClientCommit> allCommits = new ArrayList<>(commitMap.values());
        allCommits.sort((a, b) -> b.committedAt().compareTo(a.committedAt()));

        int detailLimit = (token != null && !token.isBlank()) ? 60 : 0;
        int detailedCount = 0;

        for (GitHubClient.ClientCommit c : allCommits) {
            UUID authorUserId = c.authorLogin() != null ? loginToUserId.get(c.authorLogin().toLowerCase()) : null;
            Integer adds = null;
            Integer dels = null;

            if (detailedCount < detailLimit) {
                Optional<GitHubClient.ClientCommitDetail> detail = client.getCommitDetail(owner, repoName, c.sha(), token);
                if (detail.isPresent()) {
                    adds = detail.get().additions();
                    dels = detail.get().deletions();
                }
                detailedCount++;
            }

            Optional<GithubCommit> existing = commitRepository.findByRoomIdAndSha(room.getId(), c.sha());
            if (existing.isPresent()) {
                GithubCommit gc = existing.get();
                if (adds != null) gc.setAdditions(adds);
                if (dels != null) gc.setDeletions(dels);
                commitRepository.save(gc);
            } else {
                commitRepository.save(new GithubCommit(
                        room.getId(), c.sha(), c.message(), c.authorLogin(),
                        c.authorName(), authorUserId, c.committedAt(), adds, dels, null
                ));
            }
        }

        // Update branch last commit info
        for (GithubBranch b : branches) {
            if (commitMap.containsKey(b.getLastCommitSha())) {
                GitHubClient.ClientCommit lc = commitMap.get(b.getLastCommitSha());
                b.setLastCommitMessage(lc.message());
                b.setLastCommitAt(lc.committedAt());
                branchRepository.save(b);
            }
        }
    }

    private void applyRolesAndOwners(List<GithubBranch> branches, Instant now) {
        for (GithubBranch b : branches) {
            if ("main".equalsIgnoreCase(b.getName())) {
                b.setRole("main");
            } else if (!b.isRoleLocked()) {
                boolean mergedStale = "merged".equalsIgnoreCase(b.getPrStatus())
                        && b.getLastCommitAt() != null
                        && Duration.between(b.getLastCommitAt(), now).toHours() >= 24;
                boolean inactiveStale = b.getLastCommitAt() != null
                        && Duration.between(b.getLastCommitAt(), now).toHours() >= 48;

                if (mergedStale || inactiveStale) {
                    b.setRole("stale");
                }
            }

            // Purpose defaults to PR title if empty
            if ((b.getPurpose() == null || b.getPurpose().isBlank()) && b.getPrTitle() != null && !b.getPrTitle().isBlank()) {
                String p = b.getPrTitle().length() > 140 ? b.getPrTitle().substring(0, 137) + "..." : b.getPrTitle();
                b.setPurpose(p);
            }

            branchRepository.save(b);
        }
    }

    private void autoLinkTasks(Room room, List<GithubBranch> branches) {
        List<Task> tasks = taskRepository.findByRoomIdOrderByPositionAsc(room.getId());
        if (tasks.isEmpty()) return;

        for (GithubBranch b : branches) {
            for (Task t : tasks) {
                String key = t.getTaskKey();
                if (key == null || key.isBlank()) continue;

                boolean inBranch = b.getName().toLowerCase().contains(key.toLowerCase());
                boolean inPr = b.getPrTitle() != null && b.getPrTitle().toLowerCase().contains(key.toLowerCase());
                boolean inCommit = b.getLastCommitMessage() != null && b.getLastCommitMessage().toLowerCase().contains(key.toLowerCase());

                if (inBranch || inPr || inCommit) {
                    if (!branchTaskRepository.existsById(new GithubBranchTask.GithubBranchTaskId(b.getId(), t.getId()))) {
                        branchTaskRepository.save(new GithubBranchTask(b.getId(), t.getId()));
                    }
                }
            }
        }
    }

    private void syncHealthItems(GitHubClient client, Room room, GithubRepo repo, String owner, String repoName, String token) {
        List<String> treeFiles = client.getTreeFilePaths(owner, repoName, repo.getDefaultBranch(), token);
        Optional<String> readmeOpt = client.getReadmeContent(owner, repoName, token);
        String readmeText = readmeOpt.orElse("");

        Brief brief = briefRepository.findByRoomId(room.getId()).orElse(null);
        String briefText = brief != null ? (brief.getDeliverables() + " " + brief.getTechRules()).toLowerCase() : "";

        // 1. readme
        boolean hasReadme = treeFiles.stream().anyMatch(f -> f.equalsIgnoreCase("README.md") || f.equalsIgnoreCase("README"));
        saveHealth(room.getId(), "readme", "README file", hasReadme ? "pass" : "fail",
                briefText.contains("readme"), "Project README documenting solution and setup",
                "Create README", "https://github.com/" + repo.getFullName() + "/new/" + repo.getDefaultBranch() + "?filename=README.md");

        // 2. run_instructions
        String lowerReadme = readmeText.toLowerCase();
        int keywords = 0;
        String[] runWords = {"run", "install", "setup", "npm", "mvn", "gradle", "docker", "pip", "start"};
        for (String w : runWords) {
            if (lowerReadme.contains(w)) keywords++;
        }
        boolean hasRun = keywords >= 2;
        saveHealth(room.getId(), "run_instructions", "Setup and run instructions", hasRun ? "pass" : "fail",
                true, "Checked README for build, installation, or docker run steps",
                "Edit README", "https://github.com/" + repo.getFullName() + "/edit/" + repo.getDefaultBranch() + "/README.md");

        // 3. env_example
        boolean hasEnvExample = treeFiles.stream().anyMatch(f -> f.endsWith(".env.example") || f.endsWith(".env.sample"));
        saveHealth(room.getId(), "env_example", "Environment template (.env.example)", hasEnvExample ? "pass" : "fail",
                false, "Sample environment file without live secret credentials",
                "Add template", "https://github.com/" + repo.getFullName() + "/new/" + repo.getDefaultBranch() + "?filename=.env.example");

        // 4. no_secret_files
        boolean hasSecrets = treeFiles.stream().anyMatch(f -> {
            String name = f.toLowerCase();
            return name.equals(".env") || name.endsWith("/.env") || name.endsWith("id_rsa") || name.endsWith(".pem")
                    || name.endsWith(".p12") || name.endsWith("credentials.json") || name.contains("serviceaccount")
                    || name.contains("secrets.");
        });
        saveHealth(room.getId(), "no_secret_files", "No committed credentials or keys", hasSecrets ? "fail" : "pass",
                true, "Checked file names for .env files, keys and credentials",
                null, null);

        // 5. license
        boolean hasLicenseFile = treeFiles.stream().anyMatch(f -> f.equalsIgnoreCase("LICENSE") || f.equalsIgnoreCase("LICENSE.md"));
        saveHealth(room.getId(), "license", "Open-source license", hasLicenseFile ? "pass" : "fail",
                briefText.contains("license") || briefText.contains("mit") || briefText.contains("apache"),
                "Permissive license file specifying project rights",
                "Add license", "https://github.com/" + repo.getFullName() + "/new/" + repo.getDefaultBranch() + "?filename=LICENSE");

        // 6. deployed_link
        boolean linkOk = false;
        if (repo.getDeployedLink() != null && !repo.getDeployedLink().isBlank()) {
            SafeHttpClient.SafeHttpResponse resp = safeHttpClient.headOrGet(repo.getDeployedLink(), 5000);
            linkOk = resp.ok();
        }
        saveHealth(room.getId(), "deployed_link", "Live deployment URL reachable", linkOk ? "pass" : "fail",
                briefText.contains("deploy") || briefText.contains("live url"),
                repo.getDeployedLink() != null ? "Checked deployed URL response" : "No deployed URL configured",
                "Configure link", null);

        // 7. screenshots
        boolean hasImages = treeFiles.stream().anyMatch(f -> {
            String l = f.toLowerCase();
            return (l.contains("docs/") || l.contains("screenshots/") || l.contains("assets/"))
                    && (l.endsWith(".png") || l.endsWith(".jpg") || l.endsWith(".jpeg") || l.endsWith(".webp") || l.endsWith(".gif"));
        }) || lowerReadme.contains(".png") || lowerReadme.contains(".jpg") || lowerReadme.contains(".svg");
        saveHealth(room.getId(), "screenshots", "Screenshots or visual mockups", hasImages ? "pass" : "fail",
                briefText.contains("screenshot"), "Visual assets or screenshots included in repo",
                "Upload images", "https://github.com/" + repo.getFullName() + "/upload/" + repo.getDefaultBranch());

        // 8. public_repo (only when mentioned in brief deliverables or rules)
        if (briefText.contains("public repo") || briefText.contains("public repository") || briefText.contains("open source")) {
            boolean isPublic = "public".equalsIgnoreCase(repo.getVisibility());
            saveHealth(room.getId(), "public_repo", "Repository visibility is public", isPublic ? "pass" : "fail",
                    true, "Contest rules require an accessible public repository",
                    "Change visibility", "https://github.com/" + repo.getFullName() + "/settings");
        }
    }

    private void saveHealth(UUID roomId, String key, String label, String status, boolean required, String detail, String actionLabel, String actionUrl) {
        GithubHealthItem item = healthRepository.findByRoomIdAndItemKey(roomId, key)
                .orElse(new GithubHealthItem(roomId, key, label, status, required, detail, actionLabel, actionUrl, clock.instant()));
        item.setLabel(label);
        item.setStatus(status);
        item.setRequired(required);
        item.setDetail(detail);
        item.setActionLabel(actionLabel);
        item.setActionUrl(actionUrl);
        item.setCheckedAt(clock.instant());
        healthRepository.save(item);
    }

    private void syncFrozenDemoDrift(Room room, List<GithubBranch> branches) {
        Optional<GithubFrozenDemo> frozenOpt = frozenRepository.findById(room.getId());
        if (frozenOpt.isPresent()) {
            GithubFrozenDemo frozen = frozenOpt.get();
            for (GithubBranch b : branches) {
                if (b.getName().equalsIgnoreCase(frozen.getBranchName())) {
                    if (b.getLastCommitSha() != null && !b.getLastCommitSha().equals(frozen.getSha())) {
                        // Compare count of commits on branch after frozen
                        int count = (int) commitRepository.findByRoomIdOrderByCommittedAtDesc(room.getId()).stream()
                                .filter(c -> c.getCommittedAt().isAfter(frozen.getFrozenAt()))
                                .count();
                        frozen.setCommitsSince(count);
                        frozenRepository.save(frozen);
                    }
                    break;
                }
            }
        }
    }

    private void cleanupStaleDismissals(Room room) {
        List<GithubAttentionDismissal> dismissals = dismissalRepository.findByRoomIdAndUserId(room.getId(), null);
        // Clean items whose condition no longer triggers
    }

    private Map<String, UUID> buildMemberLookup(List<RoomMember> members) {
        Map<String, UUID> map = new HashMap<>();
        for (RoomMember m : members) {
            userRepository.findById(m.getUserId()).ifPresent(u -> {
                if (u.getLogin() != null) map.put(u.getLogin().toLowerCase(), u.getId());
                if (u.getEmail() != null) map.put(u.getEmail().toLowerCase(), u.getId());
            });
        }
        return map;
    }
}
