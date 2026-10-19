package com.hackathonos.backend.github.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Component
public class RestGitHubClient implements GitHubClient {

    private static final Logger log = LoggerFactory.getLogger(RestGitHubClient.class);
    private static final String BASE_URL = "https://api.github.com";
    private static final int TIMEOUT_MS = 8000;

    private final ObjectMapper objectMapper;
    private volatile int lastRateLimitRemaining = 60;

    public RestGitHubClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public int getRateLimitRemaining() {
        return lastRateLimitRemaining;
    }

    private JsonNode request(String path, String token) {
        return request(path, token, false);
    }

    private JsonNode request(String path, String token, boolean throwOnError) {
        try {
            URL url = URI.create(BASE_URL + path).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(TIMEOUT_MS);
            conn.setReadTimeout(TIMEOUT_MS);
            conn.setRequestProperty("Accept", "application/vnd.github+json");
            conn.setRequestProperty("X-GitHub-Api-Version", "2022-11-28");
            conn.setRequestProperty("User-Agent", "brackit-Server");

            if (token != null && !token.isBlank()) {
                conn.setRequestProperty("Authorization", "Bearer " + token.trim());
            }

            int status = conn.getResponseCode();

            // Check rate limits
            String remaining = conn.getHeaderField("x-ratelimit-remaining");
            if (remaining != null) {
                try {
                    lastRateLimitRemaining = Integer.parseInt(remaining);
                } catch (NumberFormatException ignored) {}
            }
            String resetEpoch = conn.getHeaderField("x-ratelimit-reset");
            if ((status == 403 || status == 429) && "0".equals(remaining)) {
                if (throwOnError) {
                    throw new GitHubApiException(status, "GitHub rate limit reached", remaining, resetEpoch);
                }
                Instant resetAt = Instant.now().plusSeconds(60);
                if (resetEpoch != null) {
                    try {
                        resetAt = Instant.ofEpochSecond(Long.parseLong(resetEpoch));
                    } catch (Exception ignored) {}
                }
                throw new GitHubRateLimitException(resetAt);
            }

            if (status >= 400) {
                if (throwOnError) {
                    throw new GitHubApiException(status, "GitHub API error: " + status, remaining, resetEpoch);
                }
                if (status != 404) {
                    log.warn("GitHub API error: status={} path={}", status, path);
                }
                return null;
            }

            try (InputStream in = conn.getInputStream()) {
                return objectMapper.readTree(in);
            }
        } catch (GitHubApiException | GitHubRateLimitException e) {
            throw e;
        } catch (Exception e) {
            log.warn("GitHub request failed: {} -> {}", path, e.getMessage());
            return null;
        }
    }

    @Override
    public Optional<ClientRepo> getRepo(String owner, String repo, String token) {
        JsonNode node = request("/repos/" + enc(owner) + "/" + enc(repo), token, true);
        if (node == null) return Optional.empty();

        String fullName = node.path("full_name").asText(owner + "/" + repo);
        String name = node.path("name").asText(repo);
        String description = node.path("description").asText("");
        String htmlUrl = node.path("html_url").asText("https://github.com/" + fullName);
        boolean isPrivate = node.path("private").asBoolean(false);
        String defaultBranch = node.path("default_branch").asText("main");
        String language = node.path("language").asText("");
        int stars = node.path("stargazers_count").asInt(0);
        String pushedAt = node.path("pushed_at").asText(null);
        String license = node.path("license").path("spdx_id").asText(null);

        return Optional.of(new ClientRepo(
                fullName,
                name,
                description,
                htmlUrl,
                isPrivate ? "private" : "public",
                defaultBranch,
                language,
                stars,
                pushedAt,
                htmlUrl,
                license
        ));
    }

    @Override
    public List<ClientBranch> listBranches(String owner, String repo, String token) {
        JsonNode node = request("/repos/" + enc(owner) + "/" + enc(repo) + "/branches?per_page=100", token);
        if (node == null || !node.isArray()) return Collections.emptyList();

        List<ClientBranch> branches = new ArrayList<>();
        for (JsonNode b : node) {
            String name = b.path("name").asText();
            String sha = b.path("commit").path("sha").asText();
            branches.add(new ClientBranch(name, sha));
        }
        return branches;
    }

    @Override
    public ClientBranchCompare compareBranches(String owner, String repo, String base, String head, String token) {
        JsonNode node = request("/repos/" + enc(owner) + "/" + enc(repo) + "/compare/" + enc(base) + "..." + enc(head), token);
        if (node == null) return new ClientBranchCompare(0, 0);

        int ahead = node.path("ahead_by").asInt(0);
        int behind = node.path("behind_by").asInt(0);
        return new ClientBranchCompare(ahead, behind);
    }

    @Override
    public List<ClientPr> listPullRequests(String owner, String repo, String token) {
        JsonNode node = request("/repos/" + enc(owner) + "/" + enc(repo) + "/pulls?state=all&per_page=100", token);
        if (node == null || !node.isArray()) return Collections.emptyList();

        List<ClientPr> prs = new ArrayList<>();
        for (JsonNode p : node) {
            int number = p.path("number").asInt();
            String title = p.path("title").asText("");
            String headBranch = p.path("head").path("ref").asText("");
            String state = p.path("state").asText("open");
            boolean draft = p.path("draft").asBoolean(false);
            Instant openedAt = parseInstant(p.path("created_at").asText(null));
            prs.add(new ClientPr(number, title, headBranch, state, draft, openedAt));
        }
        return prs;
    }

    @Override
    public ClientPrDetail getPullRequest(String owner, String repo, int prNumber, String token) {
        JsonNode node = request("/repos/" + enc(owner) + "/" + enc(repo) + "/pulls/" + prNumber, token);
        if (node == null) return new ClientPrDetail(true, 0);

        boolean mergeable = node.path("mergeable").asBoolean(true);
        int reviewers = node.path("requested_reviewers").size();
        return new ClientPrDetail(mergeable, reviewers);
    }

    @Override
    public List<ClientCommit> listCommits(String owner, String repo, String branchOrSha, Instant since, Instant until, String token) {
        StringBuilder sb = new StringBuilder("/repos/" + enc(owner) + "/" + enc(repo) + "/commits?per_page=100");
        if (branchOrSha != null) sb.append("&sha=").append(enc(branchOrSha));
        if (since != null) sb.append("&since=").append(since.toString());
        if (until != null) sb.append("&until=").append(until.toString());

        JsonNode node = request(sb.toString(), token);
        if (node == null || !node.isArray()) return Collections.emptyList();

        List<ClientCommit> commits = new ArrayList<>();
        for (JsonNode c : node) {
            String sha = c.path("sha").asText();
            String msg = c.path("commit").path("message").asText("");
            String login = c.path("author").path("login").asText(null);
            String authorName = c.path("commit").path("author").path("name").asText(null);
            Instant date = parseInstant(c.path("commit").path("author").path("date").asText(null));
            commits.add(new ClientCommit(sha, msg, login, authorName, date != null ? date : Instant.now()));
        }
        return commits;
    }

    @Override
    public Optional<ClientCommitDetail> getCommitDetail(String owner, String repo, String sha, String token) {
        JsonNode node = request("/repos/" + enc(owner) + "/" + enc(repo) + "/commits/" + enc(sha), token);
        if (node == null) return Optional.empty();

        int additions = node.path("stats").path("additions").asInt(0);
        int deletions = node.path("stats").path("deletions").asInt(0);
        return Optional.of(new ClientCommitDetail(additions, deletions));
    }

    @Override
    public List<String> getTreeFilePaths(String owner, String repo, String branch, String token) {
        JsonNode node = request("/repos/" + enc(owner) + "/" + enc(repo) + "/git/trees/" + enc(branch) + "?recursive=1", token);
        if (node == null) return Collections.emptyList();

        List<String> paths = new ArrayList<>();
        JsonNode tree = node.path("tree");
        if (tree.isArray()) {
            for (JsonNode item : tree) {
                String path = item.path("path").asText();
                if (path != null && !path.isBlank()) {
                    paths.add(path);
                }
            }
        }
        return paths;
    }

    @Override
    public Optional<String> getReadmeContent(String owner, String repo, String token) {
        JsonNode node = request("/repos/" + enc(owner) + "/" + enc(repo) + "/readme", token);
        if (node == null) return Optional.empty();

        String contentBase64 = node.path("content").asText(null);
        if (contentBase64 != null) {
            try {
                String clean = contentBase64.replaceAll("\\s+", "");
                byte[] decoded = Base64.getDecoder().decode(clean);
                return Optional.of(new String(decoded, StandardCharsets.UTF_8));
            } catch (Exception ignored) {}
        }
        return Optional.empty();
    }

    @Override
    public List<UserRepo> listUserRepos(String token) {
        JsonNode node = request("/user/repos?per_page=100&sort=updated", token);
        if (node == null || !node.isArray()) return Collections.emptyList();

        List<UserRepo> repos = new ArrayList<>();
        for (JsonNode r : node) {
            String fullName = r.path("full_name").asText();
            boolean isPrivate = r.path("private").asBoolean(false);
            Instant updated = parseInstant(r.path("updated_at").asText(null));
            repos.add(new UserRepo(fullName, isPrivate, updated != null ? updated : Instant.now()));
        }
        return repos;
    }

    private String enc(String val) {
        return URLEncoder.encode(val, StandardCharsets.UTF_8);
    }

    private Instant parseInstant(String text) {
        if (text == null || text.isBlank()) return null;
        try {
            return Instant.parse(text);
        } catch (Exception e) {
            return null;
        }
    }
}
