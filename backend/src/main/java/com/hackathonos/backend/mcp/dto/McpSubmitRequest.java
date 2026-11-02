package com.hackathonos.backend.mcp.dto;

public record McpSubmitRequest(
        String text,
        Boolean confirm,
        Boolean override
) {
    public McpSubmitRequest(String text) {
        this(text, false, false);
    }

    public boolean isConfirm() {
        return Boolean.TRUE.equals(confirm);
    }

    public boolean isOverride() {
        return Boolean.TRUE.equals(override);
    }
}
