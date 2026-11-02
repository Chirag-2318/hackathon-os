package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.error.TooManyRequestsException;
import com.hackathonos.backend.users.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimiter rateLimiter;
    private final CurrentUser currentUser;
    private final ClientIpResolver clientIpResolver;

    public RateLimitInterceptor(RateLimiter rateLimiter, CurrentUser currentUser, ClientIpResolver clientIpResolver) {
        this.rateLimiter = rateLimiter;
        this.currentUser = currentUser;
        this.clientIpResolver = clientIpResolver;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        String uri = request.getRequestURI();
        if ("/api/v1/health".equals(uri) || "/api/v1/health/ready".equals(uri) || uri.startsWith("/actuator/health")) {
            return true;
        }

        User user = currentUser != null ? currentUser.getOptional().orElse(null) : null;

        // Unauthenticated request safeguards:
        if (user == null) {
            // 1. Global unauthenticated ceiling (1200 req/min)
            RateLimiter.RateLimitResult ceilingResult = rateLimiter.tryAcquire(
                    "global:unauth:ceiling",
                    1200,
                    1200,
                    Duration.ofMinutes(1)
            );
            if (!ceilingResult.allowed()) {
                response.setHeader("Retry-After", String.valueOf(ceilingResult.retryAfterSeconds()));
                throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                        "Service busy. Please try again after " + ceilingResult.retryAfterSeconds() + " seconds.",
                        ceilingResult.retryAfterSeconds());
            }

            // 2. Direct socket peer address bucket (prevents spoofing via forged headers on a single socket)
            String remoteAddr = request.getRemoteAddr() != null ? request.getRemoteAddr().trim() : "unknown";
            RateLimiter.RateLimitResult peerResult = rateLimiter.tryAcquire(
                    "global:unauth:peer:" + remoteAddr,
                    60,
                    60,
                    Duration.ofMinutes(1)
            );
            if (!peerResult.allowed()) {
                response.setHeader("Retry-After", String.valueOf(peerResult.retryAfterSeconds()));
                throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                        "Rate limit exceeded. Please try again after " + peerResult.retryAfterSeconds() + " seconds.",
                        peerResult.retryAfterSeconds());
            }

            // 3. Resolved client IP limit (60 req/min)
            String clientIp = extractClientIp(request);
            RateLimiter.RateLimitResult globalResult = rateLimiter.tryAcquire(
                    "global:unauth:ip:" + clientIp,
                    60,
                    60,
                    Duration.ofMinutes(1)
            );
            if (!globalResult.allowed()) {
                response.setHeader("Retry-After", String.valueOf(globalResult.retryAfterSeconds()));
                throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                        "Rate limit exceeded. Please try again after " + globalResult.retryAfterSeconds() + " seconds.",
                        globalResult.retryAfterSeconds());
            }
        }

        RateLimited rateLimited = handlerMethod.getMethodAnnotation(RateLimited.class);
        if (rateLimited == null) {
            rateLimited = handlerMethod.getBeanType().getAnnotation(RateLimited.class);
        }
        if (rateLimited == null) {
            return true;
        }

        String callerId = resolveCallerId(request, user);
        String bucketKey = rateLimited.key() + ":" + callerId;

        RateLimiter.RateLimitResult result = rateLimiter.tryAcquire(
                bucketKey,
                rateLimited.limit(),
                rateLimited.limit(),
                Duration.ofSeconds(rateLimited.periodSeconds())
        );

        if (!result.allowed()) {
            response.setHeader("Retry-After", String.valueOf(result.retryAfterSeconds()));
            throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                    "Rate limit exceeded. Please try again after " + result.retryAfterSeconds() + " seconds.",
                    result.retryAfterSeconds());
        }

        return true;
    }

    private String resolveCallerId(HttpServletRequest request, User user) {
        if (user != null && user.getId() != null) {
            return "user:" + user.getId();
        }
        return "ip:" + extractClientIp(request);
    }

    private String extractClientIp(HttpServletRequest request) {
        return clientIpResolver.resolveClientIp(request);
    }
}
