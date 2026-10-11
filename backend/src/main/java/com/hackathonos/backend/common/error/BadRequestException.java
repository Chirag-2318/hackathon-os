package com.hackathonos.backend.common.error;

import java.util.Collections;
import java.util.List;
import java.util.Map;

public class BadRequestException extends RuntimeException {
    private final String code;
    private final Map<String, String> fieldErrors;
    private final List<String> details;

    public BadRequestException(String message) {
        this("BAD_REQUEST", message, Collections.emptyMap(), Collections.emptyList());
    }

    public BadRequestException(String code, String message) {
        this(code, message, Collections.emptyMap(), Collections.emptyList());
    }

    public BadRequestException(String code, String message, Map<String, String> fieldErrors) {
        this(code, message, fieldErrors, Collections.emptyList());
    }

    public BadRequestException(String code, String message, List<String> details) {
        this(code, message, Collections.emptyMap(), details);
    }

    public BadRequestException(String code, String message, Map<String, String> fieldErrors, List<String> details) {
        super(message);
        this.code = code;
        this.fieldErrors = fieldErrors != null ? fieldErrors : Collections.emptyMap();
        this.details = details != null ? details : Collections.emptyList();
    }

    public String getCode() {
        return code;
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }

    public List<String> getDetails() {
        return details;
    }
}
