package com.hackathonos.backend.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter that enforces:
 * - no-store and Vary: Cookie for dynamic API, OAuth2, and login endpoints (protecting against CDN/Vercel edge caching).
 * - Long immutable cache headers for static uploads.
 * - Security headers: nosniff, strict referrer policy, HSTS when HTTPS, CSP default-src 'none' for JSON endpoints.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class ApiSecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // 1. Static uploads caching
        if (path.startsWith("/uploads/")) {
            response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (path.startsWith("/api/") || path.startsWith("/oauth2/") || path.startsWith("/login/")) {
            // 2. Dynamic API and Auth caching prevention
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
            response.setHeader("Pragma", "no-cache");
            response.addHeader("Vary", "Cookie");
        }

        // 3. Security headers on all API / Auth endpoints
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        response.setHeader("X-Frame-Options", "DENY");

        // 4. Strict-Transport-Security when HTTPS or behind TLS proxy
        boolean isHttps = request.isSecure() ||
                "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
        if (isHttps) {
            response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        }

        // 5. Content-Security-Policy for JSON/API endpoints
        if (path.startsWith("/api/")) {
            response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
        }

        filterChain.doFilter(request, response);
    }
}
