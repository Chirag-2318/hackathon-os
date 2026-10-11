package com.hackathonos.backend.common.security;

import java.util.List;

public final class PublicRoutes {

    private PublicRoutes() {}

    public static final List<String> PATTERNS = List.of(
            "/actuator/health",
            "/api/v1/health",
            "/login/**",
            "/oauth2/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/mock/**",
            "/api/v1/mentor/**",
            "/api/v1/public/**",
            "/api/v1/playbooks/**",
            "/api/v1/tools/**",
            "/api/v1/invites/*",
            "/api/v1/e2e/login"
    );

    public static boolean isPublic(String method, String uri) {
        if ("/api/v1/health".equals(uri) || "/actuator/health".equals(uri)) return true;
        if (uri.startsWith("/login") || uri.startsWith("/oauth2")) return true;
        if (uri.startsWith("/v3/api-docs") || uri.startsWith("/swagger-ui")) return true;
        if (uri.startsWith("/mock/")) return true;
        if (uri.startsWith("/api/v1/mentor/")) return true;
        if (uri.startsWith("/api/v1/public/")) return true;
        if (uri.startsWith("/api/v1/playbooks")) return true;
        if (uri.startsWith("/api/v1/tools")) return true;
        if ("GET".equalsIgnoreCase(method) && uri.matches("^/api/v1/invites/[^/]+$")) return true;
        if ("/api/v1/e2e/login".equals(uri)) return true;
        return false;
    }
}
