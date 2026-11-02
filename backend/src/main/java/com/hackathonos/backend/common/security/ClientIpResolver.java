package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/**
 * Resolves the client's public IP address from incoming HTTP requests.
 *
 * <p>Header resolution order:
 * 1. Configured trusted header name from {@code CLIENT_IP_HEADER} (e.g., {@code x-vercel-forwarded-for}).
 *    If {@code PROXY_SHARED_SECRET} is configured, this header is ONLY trusted when accompanied
 *    by a matching {@code x-proxy-secret} header from the reverse proxy.
 * 2. Fall back to the right-most (last) entry in {@code X-Forwarded-For} (appended by the nearest trusted proxy).
 * 3. Fall back to the direct socket address {@link HttpServletRequest#getRemoteAddr()}.
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

        // 1. Try custom trusted header (e.g., x-vercel-forwarded-for)
        String customHeaderName = appProperties.getClientIpHeader();
        String proxySecret = appProperties.getProxySharedSecret();
        boolean proxySecretConfigured = proxySecret != null && !proxySecret.isBlank();

        boolean trustCustomHeader = true;
        if (proxySecretConfigured) {
            String incomingSecret = request.getHeader("x-proxy-secret");
            if (incomingSecret == null || incomingSecret.isBlank()) {
                incomingSecret = request.getHeader("X-Proxy-Secret");
            }
            trustCustomHeader = proxySecret.equals(incomingSecret);
        }

        if (trustCustomHeader && customHeaderName != null && !customHeaderName.isBlank()) {
            String val = request.getHeader(customHeaderName);
            if (val != null && !val.isBlank()) {
                return extractRightmostIp(val);
            }
        }

        // 2. Fall back to standard X-Forwarded-For (take the right-most hop)
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return extractRightmostIp(xff);
        }

        // 3. Fall back to socket remote address
        String remote = request.getRemoteAddr();
        if (remote != null && !remote.isBlank()) {
            return remote.trim();
        }

        return "unknown";
    }

    private String extractRightmostIp(String headerValue) {
        if (headerValue == null || headerValue.isBlank()) {
            return "unknown";
        }
        String[] parts = headerValue.split(",");
        String last = parts[parts.length - 1].trim();
        return last.isEmpty() ? "unknown" : last;
    }
}
