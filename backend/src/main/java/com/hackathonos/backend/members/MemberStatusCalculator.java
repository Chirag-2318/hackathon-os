package com.hackathonos.backend.members;

import com.hackathonos.backend.tasks.Task;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class MemberStatusCalculator {

    public record CurrentTaskInfo(String key, String summary) {}
    public record MemberStatusResult(String status, CurrentTaskInfo currentTask) {}

    private final Clock clock;

    public MemberStatusCalculator(Clock clock) {
        this.clock = clock;
    }

    /**
     * Determines status ("working", "blocked", "idle") and active task for a member.
     * Rules:
     * - BLOCKED when assignee of any flagged, not-done task.
     * - WORKING when assignee of an in-progress task or online (seen within 5 minutes).
     * - IDLE otherwise.
     * - currentTask = their in-progress task with lowest position, else first todo task by position, else null.
     */
    public MemberStatusResult calculate(UUID userId, Instant lastSeenAt, List<Task> userTasks) {
        boolean online = lastSeenAt != null && Duration.between(lastSeenAt, clock.instant()).toMinutes() < 5;

        boolean hasBlocked = false;
        boolean hasInProgress = false;
        Task bestInProgress = null;
        Task bestTodo = null;

        if (userTasks != null) {
            for (Task t : userTasks) {
                String status = t.getStatus() != null ? t.getStatus().toUpperCase() : "TODO";
                boolean isDone = "DONE".equals(status);
                if (!isDone && t.isFlagged()) {
                    hasBlocked = true;
                }
                if ("IN_PROGRESS".equals(status)) {
                    hasInProgress = true;
                    if (bestInProgress == null || t.getPosition() < bestInProgress.getPosition()) {
                        bestInProgress = t;
                    }
                } else if ("TODO".equals(status)) {
                    if (bestTodo == null || t.getPosition() < bestTodo.getPosition()) {
                        bestTodo = t;
                    }
                }
            }
        }

        String statusStr;
        if (hasBlocked) {
            statusStr = "blocked";
        } else if (hasInProgress || online) {
            statusStr = "working";
        } else {
            statusStr = "idle";
        }

        Task chosenTask = bestInProgress != null ? bestInProgress : bestTodo;
        CurrentTaskInfo taskInfo = chosenTask != null
                ? new CurrentTaskInfo(chosenTask.getTaskKey(), chosenTask.getSummary())
                : null;

        return new MemberStatusResult(statusStr, taskInfo);
    }
}
