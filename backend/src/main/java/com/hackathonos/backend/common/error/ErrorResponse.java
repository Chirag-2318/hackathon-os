package com.hackathonos.backend.common.error;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

/**
 * Standard API error response body.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        String timestamp,
        int status,
        String code,
        String message,
        String requestId,
        Map<String, String> fieldErrors,
        List<String> details
) {
    public ErrorResponse(String timestamp, int status, String code, String message, String requestId) {
        this(timestamp, status, code, message, requestId, null, null);
    }

    public ErrorResponse(String timestamp, int status, String code, String message, String requestId, Map<String, String> fieldErrors) {
        this(timestamp, status, code, message, requestId, fieldErrors, null);
    }
}
