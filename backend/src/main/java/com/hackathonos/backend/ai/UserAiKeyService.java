package com.hackathonos.backend.ai;

import com.hackathonos.backend.ai.dto.SetUserAiKeyRequest;
import com.hackathonos.backend.ai.dto.UserAiKeyResponseDto;
import com.hackathonos.backend.common.error.AiKeyInvalidException;
import com.hackathonos.backend.common.error.BadGatewayException;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.security.SecretCipher;
import com.hackathonos.backend.users.dto.UserAiKeySummaryDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Service managing user-owned Groq AI keys.
 * Encrypts with AES-256-GCM and random IV per record.
 * Never logs, returns, or caches keys.
 */
@Service
public class UserAiKeyService {

    private static final Logger log = LoggerFactory.getLogger(UserAiKeyService.class);
    private static final String DEFAULT_HOST = "api.groq.com";

    private final UserAiKeyRepository userAiKeyRepository;
    private final SecretCipher secretCipher;
    private final AiProperties aiProperties;
    private final RestClient restClient;

    public UserAiKeyService(
            UserAiKeyRepository userAiKeyRepository,
            SecretCipher secretCipher,
            AiProperties aiProperties
    ) {
        this.userAiKeyRepository = userAiKeyRepository;
        this.secretCipher = secretCipher;
        this.aiProperties = aiProperties;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(10));

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .build();
    }

    public String resolveHost() {
        try {
            URI uri = URI.create(aiProperties.getBaseUrl());
            String host = uri.getHost();
            return (host != null && !host.isBlank()) ? host : DEFAULT_HOST;
        } catch (Exception e) {
            return DEFAULT_HOST;
        }
    }

    @Transactional(readOnly = true)
    public UserAiKeyResponseDto getKeyResponse(UUID userId) {
        String host = resolveHost();
        if (userId == null) {
            return new UserAiKeyResponseDto(false, null, null, null, host);
        }
        return userAiKeyRepository.findByUserId(userId)
                .map(key -> new UserAiKeyResponseDto(
                        true,
                        key.getKeyLast4(),
                        key.getStatus(),
                        key.getLastCheckedAt(),
                        host
                ))
                .orElseGet(() -> new UserAiKeyResponseDto(false, null, null, null, host));
    }

    @Transactional(readOnly = true)
    public UserAiKeySummaryDto getKeySummary(UUID userId) {
        if (userId == null) {
            return new UserAiKeySummaryDto(false, null, null);
        }
        return userAiKeyRepository.findByUserId(userId)
                .map(key -> new UserAiKeySummaryDto(true, key.getStatus(), key.getKeyLast4()))
                .orElseGet(() -> new UserAiKeySummaryDto(false, null, null));
    }

    @Transactional
    public UserAiKeyResponseDto saveKey(UUID userId, SetUserAiKeyRequest request) {
        if (request == null || request.key() == null) {
            throw new BadRequestException("INVALID_KEY", "That doesn't look like a Groq key. Groq keys start with gsk_.");
        }
        String trimmed = request.key().trim();
        if (!trimmed.startsWith("gsk_") || trimmed.length() < 20 || trimmed.length() > 200) {
            throw new BadRequestException("INVALID_KEY_FORMAT", "That doesn't look like a Groq key. Groq keys start with gsk_.");
        }

        // Verify with GET {AI_BASE_URL}/models using 10 second timeout
        String verifyUrl = aiProperties.getBaseUrl().replaceAll("/+$", "") + "/models";
        boolean isValid = false;

        try {
            var response = restClient.get()
                    .uri(verifyUrl)
                    .header("Authorization", "Bearer " + trimmed)
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
                    .toBodilessEntity();

            if (response.getStatusCode().is2xxSuccessful()) {
                isValid = true;
            }
        } catch (HttpStatusCodeException e) {
            HttpStatusCode status = e.getStatusCode();
            int statusCode = status.value();
            if (statusCode == 401 || statusCode == 403) {
                log.warn("Groq key verification rejected with HTTP {}", statusCode);
                throw new AiKeyInvalidException("Groq rejected your API key. Check it in Settings.");
            } else if (statusCode == 429) {
                log.info("Groq returned 429 during key verification, saving as VALID");
                isValid = true;
            } else {
                log.error("Groq key verification returned status {}", statusCode);
                throw new BadGatewayException("AI_UNAVAILABLE", "Couldn't reach Groq to check the key. Try again.");
            }
        } catch (Exception e) {
            log.error("Groq key verification network error: {}", e.getMessage());
            throw new BadGatewayException("AI_UNAVAILABLE", "Couldn't reach Groq to check the key. Try again.");
        }

        if (!isValid) {
            throw new BadGatewayException("AI_UNAVAILABLE", "Couldn't reach Groq to check the key. Try again.");
        }

        // Encrypt with AES-256-GCM using existing encryption key, random IV per record
        SecretCipher.EncryptedSecret encrypted = secretCipher.encryptWithIv(trimmed);
        String last4 = trimmed.substring(trimmed.length() - 4);
        Instant now = Instant.now();

        UserAiKey keyEntity = userAiKeyRepository.findByUserId(userId)
                .orElseGet(() -> new UserAiKey(userId, "GROQ", encrypted.ciphertext(), encrypted.iv(), last4, "VALID"));

        keyEntity.setKeyCiphertext(encrypted.ciphertext());
        keyEntity.setIv(encrypted.iv());
        keyEntity.setKeyLast4(last4);
        keyEntity.setStatus("VALID");
        keyEntity.setLastCheckedAt(now);
        keyEntity.setLastError(null);
        keyEntity.setUpdatedAt(now);

        userAiKeyRepository.save(keyEntity);

        return new UserAiKeyResponseDto(true, last4, "VALID", now, resolveHost());
    }

    @Transactional
    public void deleteKey(UUID userId) {
        if (userId != null) {
            userAiKeyRepository.findByUserId(userId).ifPresent(userAiKeyRepository::delete);
        }
    }

    @Transactional
    public void updateStatus(UUID userId, String status, String lastError) {
        if (userId == null) return;
        userAiKeyRepository.findByUserId(userId).ifPresent(key -> {
            key.setStatus(status);
            key.setLastError(lastError != null && lastError.length() > 200 ? lastError.substring(0, 200) : lastError);
            key.setUpdatedAt(Instant.now());
            userAiKeyRepository.save(key);
        });
    }

    @Transactional(readOnly = true)
    public Optional<String> getDecryptedKey(UUID userId) {
        if (userId == null) return Optional.empty();
        return userAiKeyRepository.findByUserId(userId).map(k ->
                secretCipher.decryptWithIv(k.getKeyCiphertext(), k.getIv())
        );
    }
}
