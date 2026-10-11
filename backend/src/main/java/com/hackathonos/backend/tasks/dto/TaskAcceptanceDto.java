package com.hackathonos.backend.tasks.dto;

import java.util.UUID;

public record TaskAcceptanceDto(
        UUID id,
        String text,
        boolean done
) {}
