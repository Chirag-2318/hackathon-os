package com.hackathonos.backend.users.dto;

import java.time.Instant;

public record DataExportResponse(String downloadUrl, Instant expiresAt) {}
