package com.hackathonos.backend.mcp.dto;

import java.util.UUID;

public record McpMeResponse(
        UUID userId,
        String name,
        String plan,
        boolean mcpAllowed
) {}
