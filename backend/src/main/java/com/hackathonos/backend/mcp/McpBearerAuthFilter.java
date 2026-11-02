package com.hackathonos.backend.mcp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.error.ErrorResponse;
import com.hackathonos.backend.common.http.RequestIdFilter;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@Component
public class McpBearerAuthFilter extends OncePerRequestFilter {

    private final McpTokenRepository mcpTokenRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public McpBearerAuthFilter(McpTokenRepository mcpTokenRepository,
                               UserRepository userRepository,
                               ObjectMapper objectMapper) {
        this.mcpTokenRepository = mcpTokenRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/v1/mcp");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            sendUnauthorized(response, "Authentication required");
            return;
        }

        String rawToken = authHeader.substring(7).trim();
        if (rawToken.isBlank()) {
            sendUnauthorized(response, "Authentication required");
            return;
        }

        String hash = McpTokenService.hashToken(rawToken);
        Optional<McpToken> tokenOpt = mcpTokenRepository.findByTokenHash(hash);
        if (tokenOpt.isEmpty()) {
            sendUnauthorized(response, "Invalid or unknown token");
            return;
        }

        McpToken token = tokenOpt.get();
        if (token.getRevokedAt() != null) {
            sendUnauthorized(response, "Token has been revoked");
            return;
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            sendUnauthorized(response, "Token has expired");
            return;
        }

        Optional<User> userOpt = userRepository.findById(token.getUserId());
        if (userOpt.isEmpty() || userOpt.get().getDeletedAt() != null) {
            sendUnauthorized(response, "User account not found or deleted");
            return;
        }

        User user = userOpt.get();
        token.setLastUsedAt(Instant.now());
        mcpTokenRepository.save(token);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(user, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Keep SecurityContext clean for stateless requests
            SecurityContextHolder.clearContext();
        }
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        String reqId = MDC.get(RequestIdFilter.MDC_KEY);
        if (reqId == null || reqId.isBlank()) {
            reqId = UUID.randomUUID().toString();
        }

        ErrorResponse errorResponse = new ErrorResponse(
                Instant.now().toString(),
                HttpServletResponse.SC_UNAUTHORIZED,
                "UNAUTHORIZED",
                message,
                reqId
        );

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
