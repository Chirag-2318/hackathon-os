package com.hackathonos.backend.docs;

import java.time.Instant;

public class DocConflictException extends RuntimeException {
    private final String content;
    private final int version;
    private final String lastEditorName;
    private final Instant updatedAt;

    public DocConflictException(String content, int version, String lastEditorName, Instant updatedAt) {
        super("Document was modified by another user");
        this.content = content;
        this.version = version;
        this.lastEditorName = lastEditorName != null ? lastEditorName : "teammate";
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public DocConflictException(String content, int version) {
        this(content, version, "teammate", Instant.now());
    }

    public String getContent() {
        return content;
    }

    public int getVersion() {
        return version;
    }

    public String getLastEditorName() {
        return lastEditorName;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
