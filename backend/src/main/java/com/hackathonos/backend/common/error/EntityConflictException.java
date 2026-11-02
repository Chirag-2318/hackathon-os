package com.hackathonos.backend.common.error;

import com.hackathonos.backend.users.dto.UserSummaryDto;
import java.time.Instant;

/**
 * Thrown when an optimistic concurrency check fails on an editable entity (task, doc, brief, mvp, idea, pitch, room).
 * Carries server version, last editor info, and current server copy for conflict resolution.
 */
public class EntityConflictException extends RuntimeException {

    private final String code;
    private final long currentVersion;
    private final UserSummaryDto lastEditedBy;
    private final String editorName;
    private final Instant updatedAt;
    private final Object latestData;

    public EntityConflictException(String code, String message, long currentVersion, UserSummaryDto lastEditedBy, Instant updatedAt, Object latestData) {
        super(message);
        this.code = code != null ? code : ErrorCode.EDIT_CONFLICT.getCode();
        this.currentVersion = currentVersion;
        this.lastEditedBy = lastEditedBy;
        this.editorName = lastEditedBy != null ? lastEditedBy.displayName() : null;
        this.updatedAt = updatedAt;
        this.latestData = latestData;
    }

    public EntityConflictException(String code, String message, long currentVersion, String editorName, Instant updatedAt, Object latestData) {
        super(message);
        this.code = code != null ? code : ErrorCode.EDIT_CONFLICT.getCode();
        this.currentVersion = currentVersion;
        this.lastEditedBy = null;
        this.editorName = editorName;
        this.updatedAt = updatedAt;
        this.latestData = latestData;
    }

    public EntityConflictException(String code, String message, long currentVersion, UserSummaryDto lastEditedBy, Instant updatedAt) {
        this(code, message, currentVersion, lastEditedBy, updatedAt, null);
    }

    public String getCode() { return code; }
    public long getCurrentVersion() { return currentVersion; }
    public UserSummaryDto getLastEditedBy() { return lastEditedBy; }
    public String getEditorName() { return editorName; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Object getLatestData() { return latestData; }
}
