package com.hackathonos.backend.overview.attention;

import com.hackathonos.backend.overview.ProgressService;
import com.hackathonos.backend.rooms.Room;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class BehindPlanRule implements AttentionRule {

    private final ProgressService progressService;

    public BehindPlanRule(ProgressService progressService) {
        this.progressService = progressService;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        ProgressService.ProgressResultDto progress = progressService.calculate(room);
        if (!progress.hasData() || progress.deltaPct() > -10) {
            return Collections.emptyList();
        }

        int behind = Math.abs(progress.deltaPct());
        String title = "Behind plan by " + behind + "%";
        String helper = "Actual completion is " + behind + "% behind schedule based on task estimates and due dates.";
        String route = "/app/room/" + room.getId() + "/overview";

        return List.of(new AttentionItem(
                "behind-plan-" + room.getId(),
                "BEHIND_PLAN",
                "amber",
                title,
                helper,
                "Review timeline",
                route,
                Collections.emptyList()
        ));
    }
}
