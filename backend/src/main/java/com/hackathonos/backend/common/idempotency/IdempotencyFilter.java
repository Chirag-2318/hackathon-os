package com.hackathonos.backend.common.idempotency;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
public class IdempotencyFilter extends OncePerRequestFilter {

    private final IdempotencyService idempotencyService;
    private final CurrentUser currentUser;

    public IdempotencyFilter(IdempotencyService idempotencyService, CurrentUser currentUser) {
        this.idempotencyService = idempotencyService;
        this.currentUser = currentUser;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String method = request.getMethod();
        String header = request.getHeader("Idempotency-Key");
        return !"POST".equalsIgnoreCase(method) || header == null || header.isBlank();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String idempotencyKey = request.getHeader("Idempotency-Key");
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        UUID userId = null;
        try {
            userId = currentUser.getOptional().map(User::getId).orElse(null);
        } catch (Exception ignored) {}

        // 1. Check if matching request succeeded in the last 24h
        var stored = idempotencyService.findStoredResponse(userId, idempotencyKey, request.getMethod(), request.getRequestURI());
        if (stored.isPresent()) {
            var entry = stored.get();
            response.setStatus(entry.status());
            if (entry.contentType() != null && !entry.contentType().isBlank()) {
                response.setContentType(entry.contentType());
            } else {
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            }
            response.setHeader("Idempotency-Key", idempotencyKey);
            response.setHeader("Idempotency-Replay", "true");
            if (entry.responseBody() != null) {
                byte[] bytes = entry.responseBody().getBytes(StandardCharsets.UTF_8);
                response.setContentLength(bytes.length);
                response.getOutputStream().write(bytes);
                response.getOutputStream().flush();
            }
            return;
        }

        // 2. Acquire lock: if concurrent request is in flight, wait up to 5s or return 409 CONCURRENT_REQUEST
        boolean locked = idempotencyService.acquireLock(userId, idempotencyKey);
        if (!locked) {
            response.setStatus(HttpStatus.CONFLICT.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            byte[] errorBytes = "{\"code\":\"CONCURRENT_REQUEST\",\"message\":\"A request with this Idempotency-Key is currently in progress\"}".getBytes(StandardCharsets.UTF_8);
            response.setContentLength(errorBytes.length);
            response.getOutputStream().write(errorBytes);
            response.getOutputStream().flush();
            return;
        }

        ContentCachingResponseWrapper wrapper = new ContentCachingResponseWrapper(response);
        try {
            filterChain.doFilter(request, wrapper);
        } finally {
            idempotencyService.releaseLock(userId, idempotencyKey);
        }

        int status = wrapper.getStatus();
        if (status >= 200 && status < 300) {
            byte[] bodyBytes = wrapper.getContentAsByteArray();
            String encoding = wrapper.getCharacterEncoding() != null ? wrapper.getCharacterEncoding() : StandardCharsets.UTF_8.name();
            String bodyStr = new String(bodyBytes, encoding);
            idempotencyService.saveResponse(
                    userId,
                    idempotencyKey,
                    request.getMethod(),
                    request.getRequestURI(),
                    status,
                    bodyStr,
                    wrapper.getContentType()
            );
        }

        wrapper.copyBodyToResponse();
    }
}

