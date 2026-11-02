package com.hackathonos.backend.ai;

import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.common.error.AiKeyMissingException;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.common.security.RateLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private LlmClient llmClient;

    @Mock
    private BriefRepository briefRepository;

    @Mock
    private UserAiKeyService userAiKeyService;

    @Mock
    private CurrentUser currentUser;

    private AiProperties properties;
    private AiCircuitBreaker circuitBreaker;
    private RateLimiter rateLimiter;
    private AiService aiService;

    private final Instant baseTime = Instant.parse("2026-10-10T12:00:00Z");

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(baseTime, ZoneId.of("UTC"));
        rateLimiter = new RateLimiter(clock);
        circuitBreaker = new AiCircuitBreaker();
        // default properties: userRatePerMinute = 10, fallback = false
        properties = new AiProperties(
                "https://api.groq.com/openai/v1",
                "",
                false,
                null,
                "llama-3.3-70b-versatile",
                null,
                null,
                true,
                45,
                2,
                4,
                10,
                true,
                "https://api.groq.com/openai/v1",
                "whisper-large-v3"
        );

        aiService = new AiService(
                llmClient,
                properties,
                circuitBreaker,
                rateLimiter,
                briefRepository,
                userAiKeyService,
                currentUser,
                null
        );
    }

    @Test
    @DisplayName("Should throw AiKeyMissingException when user has no API key configured")
    void testThrowsNoApiKeyWhenUserHasNoKey() {
        UUID userId = UUID.randomUUID();
        when(userAiKeyService.getDecryptedKey(userId)).thenReturn(Optional.empty());

        AiKeyMissingException ex = assertThrows(AiKeyMissingException.class, () ->
                aiService.complete(userId, "Hello AI"));
        assertTrue(ex.getMessage().contains("You haven't added your API key yet"));
    }

    @Test
    @DisplayName("Should execute completions and enforce rate limit after 10 requests per minute")
    void testAiCompletionAndRateLimiter() {
        UUID userId = UUID.randomUUID();
        String rawSecret = "sk-test-secret-key-123456789";
        when(userAiKeyService.getDecryptedKey(userId)).thenReturn(Optional.of(rawSecret));
        when(llmClient.chat(any(LlmRequest.class), eq(rawSecret)))
                .thenAnswer(inv -> {
                    LlmRequest req = inv.getArgument(0);
                    return new LlmResult("AI Response to: " + req.messages().get(0).content(), 10, 10, 20, "stop");
                });

        // Run 10 calls successfully
        for (int i = 0; i < 10; i++) {
            String res = aiService.complete(userId, "Prompt " + i);
            assertNotNull(res);
            assertThat(res).isEqualTo("AI Response to: Prompt " + i);
            assertFalse(res.contains(rawSecret), "API key must never appear in response");
        }

        // 11th call exceeds rate limit (10 per minute)
        TooManyRequestsException ex = assertThrows(TooManyRequestsException.class, () ->
                aiService.complete(userId, "Prompt 11"));
        assertEquals("TOO_MANY_REQUESTS", ex.getCode());
    }
}
