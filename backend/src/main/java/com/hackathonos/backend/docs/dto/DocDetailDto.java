package com.hackathonos.backend.docs.dto;

import com.hackathonos.backend.docs.DocHealthChecker.DocHealthDto;

import java.util.List;

public record DocDetailDto(
        String fileName,
        String title,
        int currentVersion,
        String content,
        String updatedAt,
        List<DocVersionDto> versions,
        String id,
        DocHealthDto health,
        int commentsCount
) {}
