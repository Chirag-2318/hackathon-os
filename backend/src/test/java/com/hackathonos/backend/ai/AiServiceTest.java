package com.hackathonos.backend.ai;

import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import com.hackathonos.backend.common.security.SecretCipher;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserApiKey;
import com.hackathonos.backend.users.UserApiKeyRepository;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
class AiServiceTest {

    @Autowired
    private AiService aiService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserApiKeyRepository apiKeyRepository;

    @Autowired
    private SecretCipher secretCipher;

    @Test
    void testThrowsNoApiKeyWhenUserHasNoKey() {
        User user = userRepository.save(new User("DEV", "ai_nokey_" + UUID.randomUUID() + "@dev.com", "No Key User", null, null, null));
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                aiService.complete(user.getId(), "Hello AI"));
        assertEquals("NO_API_KEY", ex.getCode());
    }

    @Test
    void testAiCompletionAndRateLimiter() {
        User user = userRepository.save(new User("DEV", "ai_limiter_" + UUID.randomUUID() + "@dev.com", "AI User", null, null, null));
        String rawSecret = "sk-test-secret-key-123456789";
        apiKeyRepository.save(new UserApiKey(user.getId(), "OPENAI", "OpenAI Key", secretCipher.encrypt(rawSecret), "6789"));

        aiService.setOverrideClient(prompt -> "AI Response to: " + prompt);

        // Run 10 calls successfully
        for (int i = 0; i < 10; i++) {
            String res = aiService.complete(user.getId(), "Prompt " + i);
            assertNotNull(res);
            assertFalse(res.contains(rawSecret), "API key must never appear in response");
        }

        // 11th call exceeds rate limit (10 per hour)
        TooManyRequestsException ex = assertThrows(TooManyRequestsException.class, () ->
                aiService.complete(user.getId(), "Prompt 11"));
        assertEquals("AI_RATE_LIMIT", ex.getCode());
    }
}
