package com.hackathonos.backend.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Lightweight health check endpoints for cloud hosting platforms (such as Render).
 * - GET /api/v1/health answers in <1ms without touching DB (ideal for Render liveness).
 * - GET /api/v1/health/ready verifies DB connectivity with 1s timeout (for readiness probes).
 */
@RestController
@RequestMapping("/api/v1/health")
public class PublicHealthController {

    private static final Logger log = LoggerFactory.getLogger(PublicHealthController.class);

    private final JdbcTemplate jdbcTemplate;

    public PublicHealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> check() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, Object>> ready() {
        try {
            // Check database connectivity with 1s query timeout
            jdbcTemplate.setQueryTimeout(1);
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (result != null && result == 1) {
                return ResponseEntity.ok(Map.of(
                        "status", "UP",
                        "database", "UP"
                ));
            }
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "status", "DOWN",
                    "database", "UNEXPECTED_RESULT"
            ));
        } catch (Exception e) {
            log.warn("Readiness probe failed database connectivity check: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "status", "DOWN",
                    "database", "DOWN",
                    "error", e.getClass().getSimpleName()
            ));
        }
    }
}
