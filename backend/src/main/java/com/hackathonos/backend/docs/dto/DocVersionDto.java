package com.hackathonos.backend.docs.dto;

public record DocVersionDto(
        int version,
        String createdAt,
        String createdBy,
        String summary
) {}
