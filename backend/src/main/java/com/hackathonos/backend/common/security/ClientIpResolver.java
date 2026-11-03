package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.net.InetAddress;

/**
 * Resolves the client's public IP address from incoming HTTP requests.
 *
 * <p>Resolution order:
 * 1. If {@code PROXY_SHARED_SECRET} is configured, forwarded headers are ONLY trusted when
 *    accompanied by a matching {@code x-proxy-secret} header.
 * 2. When trusted (or when {@code PROXY_SHARED_SECRET} is unset behind Vercel):
 *    a. Try {@code x-vercel-forwarded-for} (Vercel sets this with the real visitor IP).
 *    b. Try custom configured header {@code CLIENT_IP_HEADER} if different.
 *    c. Try {@code X-Forwarded-For} (taking the leftmost valid client IP literal).
 * 3. Fall back to socket direct address {@link HttpServletRequest#getRemoteAddr()}.
 * 4. Never trust any header value that is not a valid IP literal.
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

        boolean trustForwarded = shouldTrustForwardedHeaders(request);

        if (trustForwarded) {
            // 1. Try Vercel's trusted visitor IP header
            String vercelIp = extractFirstValidIp(request.getHeader("x-vercel-forwarded-for"));
            if (vercelIp != null) {
                return vercelIp;
            }

            // 2. Try custom configured header if set and different
            String customHeaderName = appProperties.getClientIpHeader();
            if (customHeaderName != null && !customHeaderName.isBlank()
                    && !"x-vercel-forwarded-for".equalsIgnoreCase(customHeaderName)) {
                String customIp = extractFirstValidIp(request.getHeader(customHeaderName));
                if (customIp != null) {
                    return customIp;
                }
            }

            // 3. Fall back to standard X-Forwarded-For (take the leftmost originating client IP)
            String xff = request.getHeader("X-Forwarded-For");
            String xffIp = extractFirstValidIp(xff);
            if (xffIp != null) {
                return xffIp;
            }
        }

        // 4. Fall back to direct socket remote address
        String remote = request.getRemoteAddr();
        if (remote != null && !remote.isBlank() && isValidIpLiteral(remote.trim())) {
            return remote.trim();
        }

        return "unknown";
    }

    private boolean shouldTrustForwardedHeaders(HttpServletRequest request) {
        String proxySecret = appProperties.getProxySharedSecret();
        if (proxySecret != null && !proxySecret.isBlank()) {
            String incomingSecret = request.getHeader("x-proxy-secret");
            if (incomingSecret == null || incomingSecret.isBlank()) {
                incomingSecret = request.getHeader("X-Proxy-Secret");
            }
            return proxySecret.equals(incomingSecret);
        }
        // When PROXY_SHARED_SECRET is not configured, trust forwarded headers from reverse proxy (e.g. Vercel)
        return true;
    }

    public static boolean isValidIpLiteral(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }
        try {
            InetAddress.ofLiteral(ip.trim());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private String extractFirstValidIp(String headerValue) {
        if (headerValue == null || headerValue.isBlank()) {
            return null;
        }
        String[] parts = headerValue.split(",");
        for (String part : parts) {
            String candidate = part.trim();
            if (isValidIpLiteral(candidate)) {
                return candidate;
            }
        }
        return null;
    }
}
