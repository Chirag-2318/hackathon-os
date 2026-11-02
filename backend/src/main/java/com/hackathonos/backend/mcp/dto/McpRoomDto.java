package com.hackathonos.backend.mcp.dto;

import java.util.UUID;

public record McpRoomDto(
        UUID id,
        String name,
        String stage,
        String role
) {}
