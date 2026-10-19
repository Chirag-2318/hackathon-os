package com.hackathonos.backend.members;

import com.hackathonos.backend.events.RoomEventHub;
import com.hackathonos.backend.tasks.Task;
import org.springframework.beans.factory.annotation.Autowired;
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
    private final RoomEventHub eventHub;

    public MemberStatusCalculator(Clock clock, @Autowired(required = false) RoomEventHub eventHub) {
        this.clock = clock;
        this.eventHub = eventHub;
    }

    /**
     * Determines status ("working", "blocked", "idle") and active task for a member.
     * Rules:
     * - Online when event hub reports active stream or last_seen_at is within 5 minutes.
     * - BLOCKED when assignee of any flagged, not-done task.
     * - WORKING when assignee of an in-progress task or online.
     * - IDLE otherwise.
     * - currentTask = their in-progress task with lowest position, else first todo task by position, else null.
     */
    public MemberStatusResult calculate(UUID roomId, UUID userId, Instant lastSeenAt, List<Task> userTasks) {
        boolean hubOnline = eventHub != null && (
                (roomId != null && eventHub.isUserOnline(roomId, userId)) ||
                eventHub.isUserOnlineAnywhere(userId)
        );
        boolean recentSeen = lastSeenAt != null && Duration.between(lastSeenAt, clock.instant()).toMinutes() < 5;
        boolean online = hubOnline || recentSeen;

        boolean hasBlocked = false;
        boolean hasInProgress = false;
        Task bestInProgress = null;
        Task bestTodo = null;

        if (userTasks != null) {
            for (Task t : userTasks) {
                if (t.isDropped()) continue;
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

    /**
     * Backward-compatible 3-arg overload for callers without room context.
     */
    public MemberStatusResult calculate(UUID userId, Instant lastSeenAt, List<Task> userTasks) {
        return calculate(null, userId, lastSeenAt, userTasks);
    }
}
