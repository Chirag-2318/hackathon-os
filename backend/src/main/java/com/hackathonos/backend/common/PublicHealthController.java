package com.hackathonos.backend.common;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Lightweight health check endpoint for cloud hosting platforms (such as Render).
 * Answers quickly with HTTP 200 and {"status":"ok"} without touching the database
 * or invoking any external network calls.
 */
@RestController
@RequestMapping("/api/v1/health")
public class PublicHealthController {

    @GetMapping
    public ResponseEntity<Map<String, String>> check() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
