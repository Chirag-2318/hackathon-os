package com.hackathonos.backend.github.client;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.security.SecretCipher;
import com.hackathonos.backend.users.UserOAuthToken;
import com.hackathonos.backend.users.UserOAuthTokenRepository;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

@Component
public class GitHubClientResolver {

    private final RestGitHubClient restClient;
    private final FakeGitHubClient fakeClient;
    private final AppProperties appProperties;
    private final UserOAuthTokenRepository userOAuthTokenRepository;
    private final SecretCipher secretCipher;
    private final Environment environment;

    public GitHubClientResolver(RestGitHubClient restClient,
                                FakeGitHubClient fakeClient,
                                AppProperties appProperties,
                                UserOAuthTokenRepository userOAuthTokenRepository,
                                SecretCipher secretCipher,
                                Environment environment) {
        this.restClient = restClient;
        this.fakeClient = fakeClient;
        this.appProperties = appProperties;
        this.userOAuthTokenRepository = userOAuthTokenRepository;
        this.secretCipher = secretCipher;
        this.environment = environment;
    }

    public GitHubClient resolveClient(String repoFullName) {
        boolean isDevOrTest = Arrays.asList(environment.getActiveProfiles()).contains("dev")
                || Arrays.asList(environment.getActiveProfiles()).contains("test");

        if ("demo/demo-repo".equalsIgnoreCase(repoFullName)) {
            return fakeClient;
        }

        if (isDevOrTest && appProperties.getGithub().isUseFake()) {
            return fakeClient;
        }

        return restClient;
    }

    public FakeGitHubClient getFakeClient() {
        return fakeClient;
    }

    /**
     * Resolves the token to use: connecting user's stored token, else app.github.token, else null.
     */
    public ResolvedToken resolveToken(UUID userId) {
        if (userId != null) {
            Optional<UserOAuthToken> userTokenOpt = userOAuthTokenRepository.findByUserIdAndProvider(userId, "GITHUB");
            if (userTokenOpt.isPresent()) {
                try {
                    String decrypted = secretCipher.decrypt(userTokenOpt.get().getAccessTokenEncrypted());
                    if (decrypted != null && !decrypted.isBlank()) {
                        return new ResolvedToken(decrypted, "user");
                    }
                } catch (Exception ignored) {}
            }
        }

        String appToken = appProperties.getGithub().getToken();
        if (appToken != null && !appToken.isBlank()) {
            return new ResolvedToken(appToken.trim(), "app");
        }

        return new ResolvedToken(null, "none");
    }

    public record ResolvedToken(String token, String source) {}
}
