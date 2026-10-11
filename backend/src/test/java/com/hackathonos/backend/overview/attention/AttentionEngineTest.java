package com.hackathonos.backend.overview.attention;

import com.hackathonos.backend.rooms.Room;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AttentionEngineTest {

    @Test
    @DisplayName("Should sort attention items by severity (red, amber, purple, gray) and cap at 5")
    void testSortingAndCapping() {
        Room room = new Room();
        room.setId(UUID.randomUUID());

        AttentionRule rule1 = r -> List.of(
                new AttentionItem("att-gray", "NOTE", "gray", "Low priority note", "info", "View", "#", Collections.emptyList()),
                new AttentionItem("att-amber-1", "WARN", "amber", "Medium warning 1", "warn", "View", "#", Collections.emptyList())
        );

        AttentionRule rule2 = r -> List.of(
                new AttentionItem("att-red-1", "BLOCKER", "red", "Critical blocker 1", "blocker", "Fix", "#", Collections.emptyList()),
                new AttentionItem("att-purple", "SKILL", "purple", "Skill gap advisory", "skills", "View", "#", Collections.emptyList()),
                new AttentionItem("att-red-2", "BLOCKER", "red", "Critical blocker 2", "blocker", "Fix", "#", Collections.emptyList()),
                new AttentionItem("att-amber-2", "WARN", "amber", "Medium warning 2", "warn", "View", "#", Collections.emptyList())
        );

        AttentionEngine engine = new AttentionEngine(List.of(rule1, rule2));
        List<AttentionItem> result = engine.evaluate(room);

        // Max 5 items
        assertEquals(5, result.size());

        // First two should be red
        assertEquals("red", result.get(0).severity());
        assertEquals("red", result.get(1).severity());

        // Next two should be amber
        assertEquals("amber", result.get(2).severity());
        assertEquals("amber", result.get(3).severity());

        // Fifth should be purple
        assertEquals("purple", result.get(4).severity());
    }

    @Test
    @DisplayName("Should be resilient if a rule throws an unexpected exception")
    void testResilienceOnRuleFailure() {
        Room room = new Room();
        room.setId(UUID.randomUUID());

        AttentionRule faultyRule = r -> {
            throw new RuntimeException("Database timeout or calculation bug");
        };

        AttentionRule healthyRule = r -> List.of(
                new AttentionItem("att-ok", "CRITICAL", "red", "Critical issue", "desc", "Fix", "#", Collections.emptyList())
        );

        AttentionEngine engine = new AttentionEngine(List.of(faultyRule, healthyRule));
        List<AttentionItem> result = engine.evaluate(room);

        assertEquals(1, result.size());
        assertEquals("att-ok", result.get(0).id());
    }
}
