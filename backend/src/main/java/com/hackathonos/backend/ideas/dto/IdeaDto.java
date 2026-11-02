package com.hackathonos.backend.ideas.dto;

import java.util.List;

public record IdeaDto(
        String id,
        String roomId,
        String text,
        List<IdeaLinkDto> links,
        List<String> notes,
        String status,
        String rejectReason,
        boolean isPrimary,
        AuthorDto author,
        String authorId,
        boolean isMine,
        String createdAt,
        String decidedAt,
        Long version,
        int votes,
        boolean hasVoted
) {
    public IdeaDto(
            String id,
            String roomId,
            String text,
            List<IdeaLinkDto> links,
            List<String> notes,
            String status,
            String rejectReason,
            boolean isPrimary,
            AuthorDto author,
            String authorId,
            boolean isMine,
            String createdAt,
            String decidedAt
    ) {
        this(id, roomId, text, links, notes, status, rejectReason, isPrimary, author, authorId, isMine, createdAt, decidedAt, 0L, 0, false);
    }
}
