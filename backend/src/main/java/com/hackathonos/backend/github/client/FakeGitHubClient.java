package com.hackathonos.backend.github.client;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Component
public class FakeGitHubClient implements GitHubClient {

    private final Clock clock;
    private final List<ClientCommit> extraCommits = new ArrayList<>();

    public FakeGitHubClient(Clock clock) {
        this.clock = clock;
    }

    public synchronized void addExtraCommits(String branch, int count, boolean beforeKickoff, Instant kickoff) {
        Instant baseTime = beforeKickoff ? kickoff.minus(Duration.ofHours(2)) : clock.instant().minus(Duration.ofMinutes(15));
        for (int i = 0; i < count; i++) {
            extraCommits.add(new ClientCommit(
                    "fake-extra-" + UUID.randomUUID().toString().substring(0, 8),
                    "Manual test commit on " + branch + " #" + (i + 1),
                    "alex-lead",
                    "Alex Rivera",
                    baseTime.plusSeconds(i * 60L)
            ));
        }
    }

    public synchronized void resetExtraCommits() {
        extraCommits.clear();
    }

    @Override
    public Optional<ClientRepo> getRepo(String owner, String repo, String token) {
        return Optional.of(new ClientRepo(
                owner + "/" + repo,
                "https://github.com/" + owner + "/" + repo,
                "public",
                "main",
                null // license missing in fake repo
        ));
    }

    @Override
    public List<ClientBranch> listBranches(String owner, String repo, String token) {
        return List.of(
                new ClientBranch("main", "sha-main-head"),
                new ClientBranch("demo-safe", "sha-demo-safe-head"),
                new ClientBranch("feat/ml-forecast", "sha-ml-head"),
                new ClientBranch("feat/dashboard", "sha-dash-head"),
                new ClientBranch("feat/api-deploy", "sha-api-head"),
                new ClientBranch("feat/auth-callback", "sha-auth-head"),
                new ClientBranch("fix/results-mobile", "sha-mobile-head"),
                new ClientBranch("docs/readme", "sha-docs-head")
        );
    }

    @Override
    public ClientBranchCompare compareBranches(String owner, String repo, String base, String head, String token) {
        return switch (head) {
            case "demo-safe" -> new ClientBranchCompare(2, 5);
            case "feat/ml-forecast" -> new ClientBranchCompare(0, 0);
            case "feat/dashboard" -> new ClientBranchCompare(4, 1);
            case "feat/api-deploy" -> new ClientBranchCompare(6, 0);
            case "feat/auth-callback" -> new ClientBranchCompare(3, 8);
            case "fix/results-mobile" -> new ClientBranchCompare(2, 0);
            case "docs/readme" -> new ClientBranchCompare(1, 0);
            default -> new ClientBranchCompare(0, 0);
        };
    }

    @Override
    public List<ClientPr> listPullRequests(String owner, String repo, String token) {
        Instant now = clock.instant();
        return List.of(
                new ClientPr(14, "feat: machine learning predictive models", "feat/ml-forecast", "merged", false, now.minus(Duration.ofHours(12))),
                new ClientPr(17, "feat: real-time dashboard analytics", "feat/dashboard", "open", true, now.minus(Duration.ofDays(2))),
                new ClientPr(18, "feat: API deployment configuration", "feat/api-deploy", "open", false, now.minus(Duration.ofHours(8))),
                new ClientPr(19, "fix: mobile layout responsiveness", "fix/results-mobile", "open", false, now.minus(Duration.ofHours(16))),
                new ClientPr(20, "docs: architecture and setup documentation", "docs/readme", "open", false, now.minus(Duration.ofHours(4)))
        );
    }

    @Override
    public ClientPrDetail getPullRequest(String owner, String repo, int prNumber, String token) {
        if (prNumber == 18) {
            // merge conflicts
            return new ClientPrDetail(false, 2);
        }
        if (prNumber == 19) {
            // open PR without reviewers for >= 12h
            return new ClientPrDetail(true, 0);
        }
        return new ClientPrDetail(true, 2);
    }

    @Override
    public List<ClientCommit> listCommits(String owner, String repo, String branchOrSha, Instant since, Instant until, String token) {
        Instant now = clock.instant();
        Instant kickoff = since != null ? since : now.minus(Duration.ofHours(24));

        List<ClientCommit> list = new ArrayList<>();
        // 42 commits spread across the event from 6 authors, none before kickoff
        String[] authors = {"alex-lead", "sam-fe", "taylor-be", "jordan-ds", "casey-ui", "morgan-qa"};
        String[] authorNames = {"Alex Rivera", "Sam Chen", "Taylor Vance", "Jordan Patel", "Casey Smith", "Morgan Lee"};

        for (int i = 0; i < 42; i++) {
            int a = i % 6;
            Instant t = kickoff.plusSeconds((i + 1) * 1800L); // every 30 mins
            list.add(new ClientCommit(
                    "sha-commit-" + String.format("%03d", i + 1),
                    "Sprint commit #" + (i + 1) + " by " + authors[a],
                    authors[a],
                    authorNames[a],
                    t
            ));
        }

        synchronized (this) {
            list.addAll(extraCommits);
        }

        list.sort((a, b) -> b.committedAt().compareTo(a.committedAt()));
        return list;
    }

    @Override
    public Optional<ClientCommitDetail> getCommitDetail(String owner, String repo, String sha, String token) {
        // Largest holds 22 percent of additions, total around 1000 additions
        if ("sha-commit-042".equals(sha)) {
            return Optional.of(new ClientCommitDetail(220, 20));
        }
        return Optional.of(new ClientCommitDetail(20, 5));
    }

    @Override
    public List<String> getTreeFilePaths(String owner, String repo, String branch, String token) {
        // license and screenshots missing, everything else present
        return List.of(
                "README.md",
                ".env.example",
                "package.json",
                "src/main.ts",
                "src/App.tsx",
                "docs/architecture.md"
        );
    }

    @Override
    public Optional<String> getReadmeContent(String owner, String repo, String token) {
        return Optional.of("""
                # Demo Hackathon Project
                
                Welcome to our project!
                
                ## Setup and Run
                Run npm install to install dependencies.
                Run npm start or npm run dev to launch the application.
                Docker compose is also supported.
                """);
    }

    @Override
    public List<UserRepo> listUserRepos(String token) {
        return List.of(
                new UserRepo("demo/demo-repo", false, clock.instant().minus(Duration.ofMinutes(10))),
                new UserRepo("hackathon-os/mess-meter", false, clock.instant().minus(Duration.ofHours(2))),
                new UserRepo("kaveri-squad/campus-app", false, clock.instant().minus(Duration.ofDays(1))),
                new UserRepo("student-lab/pitch-studio", false, clock.instant().minus(Duration.ofDays(3)))
        );
    }
}
