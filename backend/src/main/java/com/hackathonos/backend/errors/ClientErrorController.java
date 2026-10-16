package com.hackathonos.backend.errors;

import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import com.hackathonos.backend.common.security.ClientIpResolver;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.common.security.RateLimiter;
import com.hackathonos.backend.users.User;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/client-errors")
public class ClientErrorController {

    private final ClientErrorService clientErrorService;
    private final RateLimiter rateLimiter;
    private final ClientIpResolver clientIpResolver;
    private final CurrentUser currentUser;

    public record ClientErrorRequest(
            String route,
            String message,
            String stack,
            String buildId,
            String userAgent
    ) {}

    public ClientErrorController(ClientErrorService clientErrorService,
                                 RateLimiter rateLimiter,
                                 ClientIpResolver clientIpResolver,
                                 CurrentUser currentUser) {
        this.clientErrorService = clientErrorService;
        this.rateLimiter = rateLimiter;
        this.clientIpResolver = clientIpResolver;
        this.currentUser = currentUser;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> reportError(
            @RequestBody(required = false) ClientErrorRequest request,
            HttpServletRequest servletRequest
    ) {
        if (request == null || request.message() == null || request.message().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
        }

        // 1. Enforce body size cap of 8 KB
        long approxSize = (request.route() != null ? request.route().length() : 0) +
                request.message().length() +
                (request.stack() != null ? request.stack().length() : 0) +
                (request.buildId() != null ? request.buildId().length() : 0) +
                (request.userAgent() != null ? request.userAgent().length() : 0);
        if (approxSize > 8192) {
            throw new BadRequestException("PAYLOAD_TOO_LARGE", "Error payload exceeds 8 KB limit");
        }

        // 2. Resolve IP and User
        String clientIp = clientIpResolver.resolveClientIp(servletRequest);
        User user = currentUser.getOptional().orElse(null);
        UUID userId = user != null ? user.getId() : null;

        // 3. Rate limit: 20 per hour per IP
        RateLimiter.RateLimitResult ipLimit = rateLimiter.tryAcquire(
                "client-err:ip:" + clientIp,
                20,
                20,
                Duration.ofHours(1)
        );
        if (!ipLimit.allowed()) {
            throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                    "Rate limit exceeded. Please try again after " + ipLimit.retryAfterSeconds() + " seconds.",
                    ipLimit.retryAfterSeconds());
        }

        // 4. Rate limit: 20 per hour per User if authenticated
        if (userId != null) {
            RateLimiter.RateLimitResult userLimit = rateLimiter.tryAcquire(
                    "client-err:user:" + userId,
                    20,
                    20,
                    Duration.ofHours(1)
            );
            if (!userLimit.allowed()) {
                throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                        "Rate limit exceeded. Please try again after " + userLimit.retryAfterSeconds() + " seconds.",
                        userLimit.retryAfterSeconds());
            }
        }

        String userAgent = request.userAgent() != null && !request.userAgent().isBlank()
                ? request.userAgent()
                : servletRequest.getHeader("User-Agent");

        clientErrorService.reportError(
                userId,
                request.route(),
                request.message(),
                request.stack(),
                request.buildId(),
                userAgent
        );

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of("accepted", true));
    }
}
