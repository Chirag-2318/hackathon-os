package com.hackathonos.backend.meta;

import java.time.ZoneId;
import java.util.List;

public final class MetaConstants {

    private MetaConstants() {}

    public static final List<String> ROLES = List.of(
            "LEADER", "BUILDER", "DESIGNER", "QA", "DOMAIN_EXPERT"
    );

    public static final List<String> SKILLS = List.of(
            "Frontend", "Backend", "Fullstack", "Design", "ML/AI", "Hardware", "QA/Demo", "Presenter", "Domain"
    );

    public static final List<String> PRIORITIES = List.of(
            "highest", "high", "medium", "low", "lowest"
    );

    public static final List<String> TASK_STATUSES = List.of(
            "todo", "inprogress", "done"
    );

    public static final List<String> RETRO_TAGS = List.of(
            "tech", "process", "team", "scope", "time"
    );

    public static final List<String> DIAGRAM_KINDS = List.of(
            "mermaid"
    );

    public static final List<String> PITCH_FORMATS = List.of(
            "live_3min", "ppt_first", "async_video", "demo_90s"
    );

    public static final List<String> CROWD_CLICHES = List.of(
            "AI Resume Builder", "Campus Food Delivery", "Event Finder", "Study Buddy", "Hostel Laundry Tracker", "Hackathon Team Matcher"
    );

    public static final List<String> NOTE_TYPES = List.of(
            "note", "link", "risk", "feedback"
    );

    public static final int IDEA_MAX_CHARS = 500;
    public static final int TASK_SUMMARY_MAX = 140;
    public static final int DOC_MAX_CHARS = 50000;
    public static final int UPLOAD_MAX_MB = 15;

    public static final List<String> TIMEZONES = ZoneId.getAvailableZoneIds().stream().sorted().toList();
}
