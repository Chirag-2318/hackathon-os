package com.hackathonos.backend.tasks.dto;

import java.time.Instant;
import java.util.UUID;

public record TaskCommentDto(
        UUID id,
        TaskUserDto author,
        String text,
        Instant createdAt,
        Instant editedAt,
        boolean isMine
) {}
