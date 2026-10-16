package com.hackathonos.backend.admin;

import com.hackathonos.backend.admin.dto.CapacityDto;
import com.hackathonos.backend.admin.dto.WaitlistRequest;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import com.hackathonos.backend.common.security.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/public")
public class PublicCapacityController {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final AppSettingsService appSettingsService;
    private final RateLimiter rateLimiter;
    private final JdbcTemplate jdbcTemplate;
    private final com.hackathonos.backend.common.security.ClientIpResolver clientIpResolver;

    public PublicCapacityController(AppSettingsService appSettingsService,
                                    RateLimiter rateLimiter,
                                    JdbcTemplate jdbcTemplate,
                                    com.hackathonos.backend.common.security.ClientIpResolver clientIpResolver) {
        this.appSettingsService = appSettingsService;
        this.rateLimiter = rateLimiter;
        this.jdbcTemplate = jdbcTemplate;
        this.clientIpResolver = clientIpResolver;
    }

    @GetMapping("/capacity")
    public ResponseEntity<CapacityDto> getCapacity() {
        CapacityDto dto = appSettingsService.getCapacity();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).cachePublic())
                .body(dto);
    }

    @PostMapping("/waitlist")
    public ResponseEntity<Map<String, String>> joinWaitlist(@RequestBody(required = false) WaitlistRequest body,
                                                            HttpServletRequest request) {
        String clientIp = extractClientIp(request);

        // 1. Enforce IP rate limit (5 requests per hour)
        RateLimiter.RateLimitResult ipResult = rateLimiter.tryAcquire(
                "waitlist:ip:" + clientIp, 5, 5, Duration.ofHours(1)
        );
        if (!ipResult.allowed()) {
            throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                    "Rate limit exceeded. Please try again later.", ipResult.retryAfterSeconds());
        }

        Map<String, String> successResponse = Map.of("message", "You're on the list.");

        if (body == null) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(successResponse);
        }

        // 2. Honeypot check: website must be empty
        if (body.website() != null && !body.website().isBlank()) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(successResponse);
        }

        // 3. Email validation & normalization
        String rawEmail = body.email();
        if (rawEmail == null || rawEmail.isBlank()) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(successResponse);
        }

        String normalizedEmail = rawEmail.trim().toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(successResponse);
        }

        // 4. Enforce Email rate limit (3 requests per hour)
        RateLimiter.RateLimitResult emailResult = rateLimiter.tryAcquire(
                "waitlist:email:" + normalizedEmail, 3, 3, Duration.ofHours(1)
        );
        if (!emailResult.allowed()) {
            throw new TooManyRequestsException("TOO_MANY_REQUESTS",
                    "Rate limit exceeded. Please try again later.", emailResult.retryAfterSeconds());
        }

        // 5. Store in waitlist_signups (id, email, created_at, source) deduplicating on email
        try {
            jdbcTemplate.update(
                    "INSERT INTO waitlist_signups (email, source, created_at) VALUES (?, 'WEB', now()) " +
                            "ON CONFLICT (email) DO NOTHING",
                    normalizedEmail
            );
        } catch (Exception ignored) {}

        // Always return 202 Accepted
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(successResponse);
    }

    private String extractClientIp(HttpServletRequest request) {
        return clientIpResolver.resolveClientIp(request);
    }
}
