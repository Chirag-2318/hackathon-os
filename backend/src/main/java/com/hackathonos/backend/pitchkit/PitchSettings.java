package com.hackathonos.backend.pitchkit;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "pitch_settings")
public class PitchSettings {

    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "format", nullable = false, length = 20)
    private String format = "LIVE";

    @Column(name = "pitch_limit_sec", nullable = false)
    private int pitchLimitSec = 180;

    @Column(name = "qa_limit_sec", nullable = false)
    private int qaLimitSec = 120;

    @Column(name = "presenter_user_id")
    private UUID presenterUserId;

    @Column(name = "operator_user_id")
    private UUID operatorUserId;

    @Column(name = "locked", nullable = false)
    private boolean locked = false;

    @Column(name = "locked_by")
    private UUID lockedBy;

    @Column(name = "wpm", nullable = false)
    private int wpm = 150;

    @Version
    @Column(name = "version", nullable = false)
    private int version = 0;

    public PitchSettings() {}

    public PitchSettings(UUID roomId) {
        this.roomId = roomId;
    }

    public UUID getRoomId() {
        return roomId;
    }

    public void setRoomId(UUID roomId) {
        this.roomId = roomId;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public int getPitchLimitSec() {
        return pitchLimitSec;
    }

    public void setPitchLimitSec(int pitchLimitSec) {
        this.pitchLimitSec = pitchLimitSec;
    }

    public int getQaLimitSec() {
        return qaLimitSec;
    }

    public void setQaLimitSec(int qaLimitSec) {
        this.qaLimitSec = qaLimitSec;
    }

    public UUID getPresenterUserId() {
        return presenterUserId;
    }

    public void setPresenterUserId(UUID presenterUserId) {
        this.presenterUserId = presenterUserId;
    }

    public UUID getOperatorUserId() {
        return operatorUserId;
    }

    public void setOperatorUserId(UUID operatorUserId) {
        this.operatorUserId = operatorUserId;
    }

    public boolean isLocked() {
        return locked;
    }

    public void setLocked(boolean locked) {
        this.locked = locked;
    }

    public UUID getLockedBy() {
        return lockedBy;
    }

    public void setLockedBy(UUID lockedBy) {
        this.lockedBy = lockedBy;
    }

    public int getWpm() {
        return wpm;
    }

    public void setWpm(int wpm) {
        this.wpm = wpm;
    }

    public int getVersion() {
        return version;
    }

    public void setVersion(int version) {
        this.version = version;
    }
}
