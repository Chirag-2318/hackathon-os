package com.hackathonos.backend.overview.attention;

import com.hackathonos.backend.checkpoints.RoomCheckpoint;
import com.hackathonos.backend.checkpoints.RoomCheckpointRepository;
import com.hackathonos.backend.rooms.Room;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Component
public class CheckpointBehindRule implements AttentionRule {

    private final RoomCheckpointRepository checkpointRepository;
    private final Clock clock;

    public CheckpointBehindRule(RoomCheckpointRepository checkpointRepository, Clock clock) {
        this.checkpointRepository = checkpointRepository;
        this.clock = clock;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        Instant now = clock.instant();
        Instant in6Hours = now.plus(Duration.ofHours(6));
        List<RoomCheckpoint> list = checkpointRepository.findByRoomIdOrderByPositionAsc(room.getId());

        for (RoomCheckpoint cp : list) {
            if (cp.getPassedAt() == null) {
                boolean hasTarget = cp.getProgressTarget() != null;
                boolean targetBehind = hasTarget && (cp.getProgressCurrent() == null || cp.getProgressCurrent() < cp.getProgressTarget());
                boolean dueSoon = cp.getDueAt() != null && !cp.getDueAt().isBefore(now) && !cp.getDueAt().isAfter(in6Hours);

                if (dueSoon && (targetBehind || !hasTarget)) {
                    long hoursLeft = Math.max(0, Duration.between(now, cp.getDueAt()).toHours());
                    long minsLeft = Math.max(0, Duration.between(now, cp.getDueAt()).toMinutes() % 60);
                    String timeStr = hoursLeft > 0 ? hoursLeft + "h " + minsLeft + "m" : minsLeft + "m";

                    String helper = hasTarget
                            ? "Due in " + timeStr + "; progress is " + (cp.getProgressCurrent() != null ? cp.getProgressCurrent() : 0) + " of " + cp.getProgressTarget()
                            : "Due in " + timeStr + "; requires team attention";

                    return List.of(new AttentionItem(
                            "checkpoint-behind-" + cp.getId(),
                            "CHECKPOINT_BEHIND",
                            "amber",
                            cp.getTitle() + " due soon",
                            helper,
                            "View checkpoints",
                            "/app/room/" + room.getId() + "/overview",
                            Collections.emptyList()
                    ));
                }
                break;
            }
        }
        return Collections.emptyList();
    }
}
