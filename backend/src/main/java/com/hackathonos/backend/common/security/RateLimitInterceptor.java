package com.hackathonos.backend.common.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import com.hackathonos.backend.users.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RateLimitInterceptor.class);

    private final RateLimiter rateLimiter;
    private final CurrentUser currentUser;
    private final ClientIpResolver clientIpResolver;
    private final AppProperties appProperties;

    private final Cache<String, Instant> warnThrottle = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .maximumSize(5_000)
            .build();

    public RateLimitInterceptor(RateLimiter rateLimiter,
                                CurrentUser currentUser,
                                ClientIpResolver clientIpResolver,
                                AppProperties appProperties) {
        this.rateLimiter = rateLimiter;
        this.currentUser = currentUser;
        this.clientIpResolver = clientIpResolver;
        this.appProperties = appProperties;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        String uri = request.getRequestURI();

        // 1. OAuth endpoints must NEVER be rate-limited by global interceptor
        if (uri.startsWith("/oauth2/authorization") || uri.startsWith("/login/oauth2/code")) {
            return true;
        }

        User user = currentUser != null ? currentUser.getOptional().orElse(null) : null;

        // 2. Unauthenticated request processing
        if (user == null) {
            String clientIp = extractClientIp(request);

            // Exempt endpoints (/api/v1/health*, /api/v1/me, /api/v1/public/config, /api/v1/public/capacity)
            // have their own generous 300/min per-IP cap instead of the global unauth limit
            if (isExemptPath(uri)) {
                RateLimiter.RateLimitResult exemptResult = rateLimiter.tryAcquire(
                        "exempt:unauth:ip:" + clientIp,
                        300,
                        300,
                        Duration.ofMinutes(1)
                );
                if (!exemptResult.allowed()) {
                    long retryAfter = exemptResult.retryAfterSeconds();
                    response.setHeader("Retry-After", String.valueOf(retryAfter));
                    logRateLimitWarn(maskIp(clientIp), uri, retryAfter);
                    throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                            "Rate limit exceeded. Please try again after " + retryAfter + " seconds.",
                            retryAfter);
                }
                return true;
            }

            // Global ceiling across all unauthenticated visitors to prevent whole-service DDoS
            RateLimiter.RateLimitResult ceilingResult = rateLimiter.tryAcquire(
                    "global:unauth:ceiling",
                    5000,
                    5000,
                    Duration.ofMinutes(1)
            );
            if (!ceilingResult.allowed()) {
                long retryAfter = ceilingResult.retryAfterSeconds();
                response.setHeader("Retry-After", String.valueOf(retryAfter));
                logRateLimitWarn("global_ceiling", uri, retryAfter);
                throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                        "Service busy. Please try again after " + retryAfter + " seconds.",
                        retryAfter);
            }

            // Tunable unauthenticated per-IP limit (default 120 req/min)
            int unauthLimit = appProperties.getRateLimit() != null
                    ? appProperties.getRateLimit().getUnauthPerMinute()
                    : 120;
            RateLimiter.RateLimitResult unauthResult = rateLimiter.tryAcquire(
                    "global:unauth:ip:" + clientIp,
                    unauthLimit,
                    unauthLimit,
                    Duration.ofMinutes(1)
            );
            if (!unauthResult.allowed()) {
                long retryAfter = unauthResult.retryAfterSeconds();
                response.setHeader("Retry-After", String.valueOf(retryAfter));
                logRateLimitWarn(maskIp(clientIp), uri, retryAfter);
                throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                        "Rate limit exceeded. Please try again after " + retryAfter + " seconds.",
                        retryAfter);
            }
        }

        // 3. Method/controller specific @RateLimited annotation check
        RateLimited rateLimited = handlerMethod.getMethodAnnotation(RateLimited.class);
        if (rateLimited == null) {
            rateLimited = handlerMethod.getBeanType().getAnnotation(RateLimited.class);
        }
        if (rateLimited != null) {
            String callerId = resolveCallerId(request, user);
            String bucketKey = rateLimited.key() + ":" + callerId;

            RateLimiter.RateLimitResult result = rateLimiter.tryAcquire(
                    bucketKey,
                    rateLimited.limit(),
                    rateLimited.limit(),
                    Duration.ofSeconds(rateLimited.periodSeconds())
            );

            if (!result.allowed()) {
                long retryAfter = result.retryAfterSeconds();
                response.setHeader("Retry-After", String.valueOf(retryAfter));
                logRateLimitWarn(maskCaller(callerId), uri, retryAfter);
                throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                        "Rate limit exceeded. Please try again after " + retryAfter + " seconds.",
                        retryAfter);
            }
            return true;
        }

        // 4. Authenticated default per-user rate limit (default 600 req/min)
        if (user != null && user.getId() != null) {
            int authLimit = appProperties.getRateLimit() != null
                    ? appProperties.getRateLimit().getAuthPerMinute()
                    : 600;
            RateLimiter.RateLimitResult authResult = rateLimiter.tryAcquire(
                    "global:auth:user:" + user.getId(),
                    authLimit,
                    authLimit,
                    Duration.ofMinutes(1)
            );
            if (!authResult.allowed()) {
                long retryAfter = authResult.retryAfterSeconds();
                response.setHeader("Retry-After", String.valueOf(retryAfter));
                logRateLimitWarn(maskUser(user.getId().toString()), uri, retryAfter);
                throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                        "Rate limit exceeded. Please try again after " + retryAfter + " seconds.",
                        retryAfter);
            }
        }

        return true;
    }

    private boolean isExemptPath(String uri) {
        return "/api/v1/health".equals(uri)
                || uri.startsWith("/api/v1/health/")
                || uri.startsWith("/actuator/health")
                || "/api/v1/me".equals(uri)
                || "/api/v1/public/config".equals(uri)
                || "/api/v1/public/capacity".equals(uri);
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

    private void logRateLimitWarn(String maskedKey, String path, long retryAfterSeconds) {
        String cacheKey = maskedKey + ":" + path;
        if (warnThrottle.asMap().putIfAbsent(cacheKey, Instant.now()) == null) {
            log.warn("Rate limit exceeded for key '{}' on path '{}'. Retry-After: {}s",
                    maskedKey, path, retryAfterSeconds);
        }
    }

    public static String maskIp(String ip) {
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            return "unknown";
        }
        if (ip.contains(":")) {
            String[] parts = ip.split(":");
            if (parts.length >= 2) {
                return parts[0] + ":" + parts[1] + ":***";
            }
            return ip.substring(0, Math.min(ip.length(), 4)) + "***";
        }
        if (ip.contains(".")) {
            String[] parts = ip.split("\\.");
            if (parts.length >= 2) {
                return parts[0] + "." + parts[1] + ".***.***";
            }
        }
        return "masked";
    }

    public static String maskUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return "user:unknown";
        }
        return "user:" + (userId.length() > 8 ? userId.substring(0, 8) + "-***" : userId);
    }

    private static String maskCaller(String callerId) {
        if (callerId == null) return "unknown";
        if (callerId.startsWith("user:")) {
            return maskUser(callerId.substring(5));
        }
        if (callerId.startsWith("ip:")) {
            return "ip:" + maskIp(callerId.substring(3));
        }
        return maskIp(callerId);
    }
}
