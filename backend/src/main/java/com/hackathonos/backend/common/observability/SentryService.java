package com.hackathonos.backend.common.observability;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Lightweight Sentry integration that remains completely dormant unless SENTRY_DSN is configured.
 * Strictly scrubs PII (emails, tokens, passwords, secrets, cookies, auth headers) before transmission.
 */
@Service
public class SentryService {

    private static final Logger log = LoggerFactory.getLogger(SentryService.class);
    private static final Pattern SENSITIVE_PATTERN = Pattern.compile("(?i)(password|secret|token|bearer|key|credential|authorization|cookie)\\s*[:=]\\s*['\"]?[^\\s,'\"&]+");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");

    private final boolean enabled;
    private final String dsn;
    private final String ingestUrl;
    private final String publicKey;
    private final RestClient restClient;

    public SentryService(@Value("${sentry.dsn:${SENTRY_DSN:}}") String dsn) {
        this.dsn = dsn != null ? dsn.trim() : "";
        if (this.dsn.isBlank()) {
            this.enabled = false;
            this.ingestUrl = null;
            this.publicKey = null;
            this.restClient = null;
            log.info("Sentry integration: dormant (SENTRY_DSN is not configured)");
        } else {
            String pubKey = null;
            String endpoint = null;
            try {
                URI uri = URI.create(this.dsn);
                String userInfo = uri.getUserInfo();
                pubKey = userInfo != null ? userInfo.split(":")[0] : null;
                String path = uri.getPath();
                String projectId = path != null ? path.replaceAll("^/+", "") : "";
                endpoint = uri.getScheme() + "://" + uri.getHost() + (uri.getPort() > 0 ? ":" + uri.getPort() : "") + "/api/" + projectId + "/store/";
            } catch (Exception e) {
                log.warn("Failed to parse SENTRY_DSN: {}", e.getMessage());
            }
            this.publicKey = pubKey;
            this.ingestUrl = endpoint;
            this.enabled = pubKey != null && endpoint != null;
            this.restClient = this.enabled ? RestClient.builder().build() : null;
            if (this.enabled) {
                log.info("Sentry integration: active, reporting to {}", ingestUrl);
            }
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void captureException(Throwable throwable, String requestId, Map<String, Object> extraContext) {
        if (!enabled || throwable == null) {
            return;
        }

        try {
            String scrubbedMessage = scrub(throwable.getMessage());
            String eventId = UUID.randomUUID().toString().replace("-", "");

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("event_id", eventId);
            payload.put("timestamp", Instant.now().toString());
            payload.put("platform", "java");
            payload.put("level", "error");
            payload.put("logger", "brackit-backend");

            Map<String, Object> tags = new HashMap<>();
            if (requestId != null) tags.put("requestId", requestId);
            payload.put("tags", tags);

            Map<String, Object> exception = new HashMap<>();
            List<Map<String, Object>> values = new ArrayList<>();
            Map<String, Object> excVal = new HashMap<>();
            excVal.put("type", throwable.getClass().getName());
            excVal.put("value", scrubbedMessage);
            values.add(excVal);
            exception.put("values", values);
            payload.put("exception", exception);

            if (extraContext != null && !extraContext.isEmpty()) {
                Map<String, Object> scrubbedExtra = new HashMap<>();
                extraContext.forEach((k, v) -> {
                    if (!k.equalsIgnoreCase("cookie") && !k.equalsIgnoreCase("authorization") && !k.equalsIgnoreCase("password")) {
                        scrubbedExtra.put(k, scrub(String.valueOf(v)));
                    }
                });
                payload.put("extra", scrubbedExtra);
            }

            restClient.post()
                    .uri(ingestUrl)
                    .header("X-Sentry-Auth", "Sentry sentry_version=7, sentry_client=brackit-backend/1.0, sentry_key=" + publicKey)
                    .header("Content-Type", "application/json")
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.debug("Failed sending exception to Sentry: {}", e.getMessage());
        }
    }

    private String scrub(String input) {
        if (input == null) return null;
        String s = EMAIL_PATTERN.matcher(input).replaceAll("[REDACTED_EMAIL]");
        return SENSITIVE_PATTERN.matcher(s).replaceAll("$1=[REDACTED]");
    }
}
