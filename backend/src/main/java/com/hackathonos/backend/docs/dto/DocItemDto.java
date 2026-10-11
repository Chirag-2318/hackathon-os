package com.hackathonos.backend.docs.dto;

import com.hackathonos.backend.docs.DocHealthChecker.DocHealthDto;

public record DocItemDto(
        String fileName,
        String title,
        int currentVersion,
        String updatedAt,
        long sizeBytes,
        String id,
        String content,
        DocHealthDto health
) {}
