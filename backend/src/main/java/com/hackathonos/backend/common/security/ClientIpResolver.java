package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/**
 * Resolves the client's public IP address from incoming HTTP requests.
 *
 * <p>Header resolution order:
 * 1. Configured trusted header name from {@code CLIENT_IP_HEADER} (defaults to {@code x-vercel-forwarded-for}).
 * 2. Fall back to the first entry in {@code x-forwarded-for}.
 * 3. Fall back to the direct socket address {@link HttpServletRequest#getRemoteAddr()}.
 *
 * <h3>Spoofing Boundaries and Limitations:</h3>
 * <ul>
 *   <li><b>Trust Boundary:</b> HTTP headers such as {@code X-Forwarded-For} or {@code x-vercel-forwarded-for}
 *       can be arbitrarily spoofed by an untrusted client IF the backend is exposed directly to the public internet.</li>
 *   <li><b>Proxy Guarantees:</b> When running behind trusted proxies (e.g., Caddy on the VM or Vercel edge nodes),
 *       the proxy strip/replaces or prefixes the header with the client's verified socket address.</li>
 *   <li><b>Host Security:</b> The Docker Compose setup ensures that the Spring Boot backend service is bound ONLY
 *       to the internal container network and is NEVER directly published to host ports. Only Caddy listens on 80/443.</li>
 * </ul>
 */
@Component
public class ClientIpResolver {

    private final AppProperties appProperties;

    public ClientIpResolver(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }

        // 1. Try trusted header (e.g. x-vercel-forwarded-for)
        String customHeaderName = appProperties.getClientIpHeader();
        if (customHeaderName != null && !customHeaderName.isBlank()) {
            String val = request.getHeader(customHeaderName);
            if (val != null && !val.isBlank()) {
                return extractFirstIp(val);
            }
        }

        // 2. Fall back to standard X-Forwarded-For
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return extractFirstIp(xff);
        }

        // 3. Fall back to socket remote address
        String remote = request.getRemoteAddr();
        if (remote != null && !remote.isBlank()) {
            return remote.trim();
        }

        return "unknown";
    }

    private String extractFirstIp(String headerValue) {
        if (headerValue == null || headerValue.isBlank()) {
            return "unknown";
        }
        String first = headerValue.split(",")[0].trim();
        return first.isEmpty() ? "unknown" : first;
    }
}
