package com.hackathonos.backend.mcp.dto;

import java.util.List;

public record McpStepDto(
        int number,
        String key,
        String title,
        List<String> expectedFiles,
        String status
) {}
