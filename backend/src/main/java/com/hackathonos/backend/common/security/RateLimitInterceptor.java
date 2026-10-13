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

    public RateLimitInterceptor(RateLimiter rateLimiter, CurrentUser currentUser) {
        this.rateLimiter = rateLimiter;
        this.currentUser = currentUser;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RateLimited rateLimited = handlerMethod.getMethodAnnotation(RateLimited.class);
        if (rateLimited == null) {
            rateLimited = handlerMethod.getBeanType().getAnnotation(RateLimited.class);
        }
        if (rateLimited == null) {
            return true;
        }

        String callerId = resolveCallerId(request);
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

    private String resolveCallerId(HttpServletRequest request) {
        User user = currentUser != null ? currentUser.get() : null;
        if (user != null && user.getId() != null) {
            return "user:" + user.getId();
        }
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        } else {
            ip = ip.split(",")[0].trim();
        }
        return "ip:" + (ip != null ? ip : "unknown");
    }
}
