package com.hackathonos.backend.errors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ClientErrorService {

    private static final Logger log = LoggerFactory.getLogger(ClientErrorService.class);

    private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    private static final Pattern SENSITIVE_TOKEN_PATTERN = Pattern.compile("(?i)(bearer\\s+[A-Za-z0-9\\-._~+/]+=*|token[=:]\\s*['\"]?[A-Za-z0-9\\-._~+/]+|password[=:]\\s*['\"]?[^\\s,'\"&]+|secret[=:]\\s*['\"]?[^\\s,'\"&]+)");

    private final ClientErrorRepository clientErrorRepository;

    public ClientErrorService(ClientErrorRepository clientErrorRepository) {
        this.clientErrorRepository = clientErrorRepository;
    }

    @Transactional
    public void reportError(UUID userId, String route, String rawMessage, String rawStack, String buildId, String userAgent) {
        if (rawMessage == null || rawMessage.isBlank()) {
            return;
        }

        // 1. Scrub personal and sensitive content
        String sanitizedMessage = scrubSensitive(rawMessage);
        String sanitizedStack = rawStack != null ? scrubSensitive(rawStack) : null;

        // 2. Enforce field caps
        String cappedRoute = truncate(route, 255);
        String cappedMessage = truncate(sanitizedMessage, 500);
        String cappedStack = truncate(sanitizedStack, 4000);
        String cappedBuildId = truncate(buildId, 100);
        String cappedUserAgent = truncate(userAgent, 300);

        // 3. Deduplicate within 10 minutes
        Instant tenMinutesAgo = Instant.now().minus(Duration.ofMinutes(10));
        List<ClientError> recent = clientErrorRepository.findRecentMatching(
                cappedMessage,
                cappedRoute,
                tenMinutesAgo,
                PageRequest.of(0, 1)
        );

        if (!recent.isEmpty()) {
            ClientError existing = recent.get(0);
            existing.setCount(existing.getCount() + 1);
            existing.setLastSeenAt(Instant.now());
            clientErrorRepository.save(existing);
            log.debug("Deduplicated client error '{}' (count={})", cappedMessage, existing.getCount());
        } else {
            ClientError newError = new ClientError(
                    userId,
                    cappedRoute,
                    cappedMessage,
                    cappedStack,
                    cappedBuildId,
                    cappedUserAgent
            );
            clientErrorRepository.save(newError);
            log.info("Recorded new client error: route='{}', message='{}'", cappedRoute, cappedMessage);
        }
    }

    private String scrubSensitive(String input) {
        if (input == null) return null;
        String scrubbed = EMAIL_PATTERN.matcher(input).replaceAll("[REDACTED_EMAIL]");
        scrubbed = SENSITIVE_TOKEN_PATTERN.matcher(scrubbed).replaceAll("[REDACTED_CREDENTIAL]");
        return scrubbed;
    }

    private String truncate(String val, int maxLen) {
        if (val == null) return null;
        String trimmed = val.trim();
        return trimmed.length() <= maxLen ? trimmed : trimmed.substring(0, maxLen);
    }
}
