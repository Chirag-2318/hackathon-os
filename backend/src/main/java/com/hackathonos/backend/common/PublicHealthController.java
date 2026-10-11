package com.hackathonos.backend.common;

import com.hackathonos.backend.common.dto.HealthResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/health")
public class PublicHealthController {

    @GetMapping
    public HealthResponse check() {
        return new HealthResponse("ok", Instant.now());
    }
}
