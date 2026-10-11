package com.hackathonos.backend.common.error;

import java.util.Collections;
import java.util.List;

public class ConflictException extends RuntimeException {
    private final String code;
    private final List<String> details;

    public ConflictException(String message) {
        this("CONFLICT", message, Collections.emptyList());
    }

    public ConflictException(String code, String message) {
        this(code, message, Collections.emptyList());
    }

    public ConflictException(String code, String message, List<String> details) {
        super(message);
        this.code = code;
        this.details = details != null ? details : Collections.emptyList();
    }

    public String getCode() {
        return code;
    }

    public List<String> getDetails() {
        return details;
    }
}
