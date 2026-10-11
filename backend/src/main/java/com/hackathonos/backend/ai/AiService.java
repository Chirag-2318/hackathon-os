package com.hackathonos.backend.ai;

import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.security.SecretCipher;
import com.hackathonos.backend.users.UserApiKey;
import com.hackathonos.backend.users.UserApiKeyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service orchestrating AI completions with rate limiting and key decryption.
 */
@Service
public class AiService {

    private final UserApiKeyRepository apiKeyRepository;
    private final SecretCipher secretCipher;
    private final AiRateLimiter rateLimiter;
    private final OpenAiClient openAiClient;
    private final AnthropicClient anthropicClient;
    private final GeminiClient geminiClient;

    private AiClient overrideClient;

    public AiService(
            UserApiKeyRepository apiKeyRepository,
            SecretCipher secretCipher,
            AiRateLimiter rateLimiter,
            OpenAiClient openAiClient,
            AnthropicClient anthropicClient,
            GeminiClient geminiClient) {
        this.apiKeyRepository = apiKeyRepository;
        this.secretCipher = secretCipher;
        this.rateLimiter = rateLimiter;
        this.openAiClient = openAiClient;
        this.anthropicClient = anthropicClient;
        this.geminiClient = geminiClient;
    }

    public void setOverrideClient(AiClient overrideClient) {
        this.overrideClient = overrideClient;
    }

    /**
     * Executes AI completion using caller's most recent API key.
     * Enforces hourly rate limit and updates key last_used_at.
     */
    @Transactional
    public String complete(UUID userId, String prompt) {
        if (overrideClient != null) {
            rateLimiter.checkAndRecord(userId);
            return overrideClient.complete(prompt);
        }

        List<UserApiKey> keys = apiKeyRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (keys.isEmpty()) {
            throw new BadRequestException("NO_API_KEY", "You do not have any saved API keys. Add one in Settings.");
        }

        UserApiKey key = keys.get(0);
        rateLimiter.checkAndRecord(userId);

        String decryptedKey = secretCipher.decrypt(key.getKeyEncrypted());
        key.setLastUsedAt(Instant.now());
        apiKeyRepository.save(key);

        String provider = key.getProvider().toLowerCase();
        return switch (provider) {
            case "anthropic" -> anthropicClient.completeWithKey(decryptedKey, prompt);
            case "gemini" -> geminiClient.completeWithKey(decryptedKey, prompt);
            case "openai" -> openAiClient.completeWithKey(decryptedKey, prompt);
            default -> openAiClient.completeWithKey(decryptedKey, prompt);
        };
    }
}
