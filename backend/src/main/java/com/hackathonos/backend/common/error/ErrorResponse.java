package com.hackathonos.backend.common.error;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Standard unified API error response body:
 * { code, message, details, requestId, timestamp }
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        String code,
        String message,
        Object details,
        String requestId,
        String timestamp,
        Integer status
) {
    public ErrorResponse(String code, String message, Object details, String requestId) {
        this(code, message, details, requestId, Instant.now().toString(), null);
    }

    public ErrorResponse(String code, String message, Object details, String requestId, String timestamp) {
        this(code, message, details, requestId, timestamp, null);
    }

    // Backward-compatible constructors for existing callers
    public ErrorResponse(String timestamp, int status, String code, String message, String requestId) {
        this(code, message, null, requestId, timestamp, status);
    }

    public ErrorResponse(String timestamp, int status, String code, String message, String requestId, Map<String, String> fieldErrors) {
        this(code, message, fieldErrors, requestId, timestamp, status);
    }

    public ErrorResponse(String timestamp, int status, String code, String message, String requestId, Map<String, String> fieldErrors, List<String> details) {
        this(code, message, fieldErrors != null ? fieldErrors : details, requestId, timestamp, status);
    }
}
