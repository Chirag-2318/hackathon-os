package com.hackathonos.backend.mcp.dto;

import java.util.List;

public record McpBriefResponse(
        String step,
        List<String> expectedFiles,
        String prompt,
        String context,
        String webUrl
) {}
