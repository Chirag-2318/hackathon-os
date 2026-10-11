package com.hackathonos.backend.overview.attention;

import com.hackathonos.backend.rooms.Room;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AttentionEngine {

    private final List<AttentionRule> rules;

    public AttentionEngine(List<AttentionRule> rules) {
        this.rules = rules != null ? rules : Collections.emptyList();
    }

    /**
     * Evaluates all attention rules for a room, sorts by severity (red, amber, purple, gray), and caps at 5 items.
     */
    public List<AttentionItem> evaluate(Room room) {
        List<AttentionItem> all = new ArrayList<>();
        for (AttentionRule rule : rules) {
            try {
                List<AttentionItem> items = rule.check(room);
                if (items != null) {
                    all.addAll(items);
                }
            } catch (Exception ignored) {
                // Keep engine resilient if one rule encounters an issue
            }
        }

        all.sort(Comparator.comparingInt(this::severityRank));

        if (all.size() > 5) {
            return all.subList(0, 5);
        }
        return all;
    }

    private int severityRank(AttentionItem item) {
        String s = item.severity() != null ? item.severity().toLowerCase() : "";
        return switch (s) {
            case "red" -> 0;
            case "amber" -> 1;
            case "purple" -> 2;
            case "gray" -> 3;
            default -> 4;
        };
    }
}
