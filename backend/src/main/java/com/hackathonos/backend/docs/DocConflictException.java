package com.hackathonos.backend.docs;

public class DocConflictException extends RuntimeException {
    private final String content;
    private final int version;

    public DocConflictException(String content, int version) {
        super("Document was modified by another user");
        this.content = content;
        this.version = version;
    }

    public String getContent() {
        return content;
    }

    public int getVersion() {
        return version;
    }
}
