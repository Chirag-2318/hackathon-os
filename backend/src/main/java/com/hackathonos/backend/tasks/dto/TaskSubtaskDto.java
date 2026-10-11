package com.hackathonos.backend.tasks.dto;

import java.util.UUID;

public record TaskSubtaskDto(
        UUID id,
        String text,
        boolean done
) {}
