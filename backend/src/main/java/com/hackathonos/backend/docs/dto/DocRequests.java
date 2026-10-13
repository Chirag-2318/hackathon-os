package com.hackathonos.backend.docs.dto;

import java.time.Instant;
import java.util.UUID;

public class DocRequests {

    public record UpdateDocRequest(
            String content,
            String summary,
            Integer baseVersion
    ) {}

    public record CreateDocRequest(
            String fileName,
            String title,
            String content
    ) {}

    public record RestoreDocRequest(
            int version
    ) {}

    public record CreateCommentRequest(
            String text
    ) {}

    public record DocCommentDto(
            UUID id,
            DocCommentAuthorDto author,
            String text,
            Instant createdAt,
            boolean isMine
    ) {}

    public record DocCommentAuthorDto(
            UUID userId,
            String name,
            String avatarUrl
    ) {}

    public record VersionContentDto(
            int version,
            String content
    ) {}

    public record DocAiRequest(
            String prompt,
            String selectedText,
            String fullContent,
            String action
    ) {}

    public record DocAiResponse(
            String answer,
            java.util.List<String> sources,
            String model,
            long latencyMs
    ) {}
}
