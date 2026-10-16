package com.hackathonos.backend.portfolio;

import com.hackathonos.backend.portfolio.PortfolioDtos.MilestoneDto;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Single service place defining all milestone evaluation rules.
 * Easily extensible with new thresholds and achievements.
 */
@Component
public class MilestoneEvaluator {

    public record MilestoneContext(
            long hackathonsJoined,
            long projectsShipped,
            long teamsLed,
            long tasksConfirmed,
            long ideasApproved,
            long commitsCount,
            int streakDays,
            long teammatesCount
    ) {}

    public List<MilestoneDto> evaluate(MilestoneContext ctx) {
        List<MilestoneDto> all = new ArrayList<>();

        // 1. First Room
        all.add(create(
                "FIRST_ROOM",
                "First Step",
                "Created or joined your first hackathon room",
                ctx.hackathonsJoined() >= 1,
                (int) Math.min(ctx.hackathonsJoined(), 1),
                1,
                "compass"
        ));

        // 2. First Shipped Project
        all.add(create(
                "FIRST_SHIP",
                "Shipped",
                "Successfully completed and submitted a hackathon project",
                ctx.projectsShipped() >= 1,
                (int) Math.min(ctx.projectsShipped(), 1),
                1,
                "ship"
        ));

        // 3. Team Leader
        all.add(create(
                "TEAM_LEAD",
                "Squad Leader",
                "Led a hackathon team as room leader",
                ctx.teamsLed() >= 1,
                (int) Math.min(ctx.teamsLed(), 1),
                1,
                "shield"
        ));

        // 4. Idea Approved
        all.add(create(
                "IDEA_VALIDATED",
                "Idea Maker",
                "Had an idea accepted into project planning",
                ctx.ideasApproved() >= 1,
                (int) Math.min(ctx.ideasApproved(), 1),
                1,
                "sparkle"
        ));

        // 5. 10 Tasks Confirmed
        all.add(create(
                "TASK_10",
                "Doer",
                "Completed and confirmed 10 development tasks",
                ctx.tasksConfirmed() >= 10,
                (int) Math.min(ctx.tasksConfirmed(), 10),
                10,
                "check-circle"
        ));

        // 6. 50 Tasks Confirmed
        all.add(create(
                "TASK_50",
                "Workhorse",
                "Completed and confirmed 50 development tasks",
                ctx.tasksConfirmed() >= 50,
                (int) Math.min(ctx.tasksConfirmed(), 50),
                50,
                "hammer"
        ));

        // 7. Code Shipper (Git Commits)
        all.add(create(
                "CODE_SHIPPER",
                "Git Pusher",
                "Pushed real code commits tracked in GitHub",
                ctx.commitsCount() >= 1,
                (int) Math.min(ctx.commitsCount(), 1),
                1,
                "git-commit"
        ));

        // 8. 5 Hackathons
        all.add(create(
                "HACKATHONS_5",
                "Serial Hacker",
                "Joined 5 or more hackathons",
                ctx.hackathonsJoined() >= 5,
                (int) Math.min(ctx.hackathonsJoined(), 5),
                5,
                "award"
        ));

        // 9. 10 Hackathons
        all.add(create(
                "HACKATHONS_10",
                "Veteran Hacker",
                "Completed 10 or more hackathons",
                ctx.hackathonsJoined() >= 10,
                (int) Math.min(ctx.hackathonsJoined(), 10),
                10,
                "crown"
        ));

        // 10. 7-Day Build Streak
        all.add(create(
                "STREAK_7",
                "Momentum",
                "Maintained a 7-day build streak across projects",
                ctx.streakDays() >= 7,
                Math.min(ctx.streakDays(), 7),
                7,
                "flame"
        ));

        // Collect earned ones
        List<MilestoneDto> earned = all.stream().filter(MilestoneDto::earned).toList();

        // Find next 2 achievable locked ones sorted by progress percentage descending
        List<MilestoneDto> locked = all.stream()
                .filter(m -> !m.earned())
                .sorted(Comparator.comparingDouble((MilestoneDto m) -> (double) m.progress() / m.target()).reversed())
                .limit(2)
                .toList();

        List<MilestoneDto> result = new ArrayList<>(earned);
        result.addAll(locked);
        return result;
    }

    private MilestoneDto create(String id, String title, String desc, boolean earned, int progress, int target, String icon) {
        return new MilestoneDto(
                id,
                title,
                desc,
                earned,
                earned ? "Earned" : null,
                progress,
                target,
                icon
        );
    }
}
