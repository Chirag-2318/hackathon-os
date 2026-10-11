package com.hackathonos.backend.common.dto;

import java.time.Instant;

public record HealthResponse(String status, Instant serverNow) {}
