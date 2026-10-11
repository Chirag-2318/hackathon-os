package com.hackathonos.backend.overview.attention;

import com.hackathonos.backend.rooms.Room;

import java.util.List;

public interface AttentionRule {
    /**
     * Evaluates room state and returns zero or more attention items requiring team action.
     */
    List<AttentionItem> check(Room room);
}
