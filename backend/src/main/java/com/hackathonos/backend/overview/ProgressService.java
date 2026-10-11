package com.hackathonos.backend.overview;

import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class ProgressService {

    public record ProgressPointDto(
            Instant t,
            int pct
    ) {}

    public record ProgressResultDto(
            boolean hasData,
            List<ProgressPointDto> planned,
            List<ProgressPointDto> actual,
            Instant now,
            int deltaPct,
            int actualPct,
            int plannedPct
    ) {}

    private final TaskRepository taskRepository;
    private final Clock clock;

    public ProgressService(TaskRepository taskRepository, Clock clock) {
        this.taskRepository = taskRepository;
        this.clock = clock;
    }

    /**
     * Computes hourly planned burnup curve against actual task completion burnup curve.
     */
    public ProgressResultDto calculate(Room room) {
        List<Task> tasks = taskRepository.findByRoomId(room.getId());
        if (tasks.isEmpty()) {
            return new ProgressResultDto(
                    false,
                    Collections.emptyList(),
                    Collections.emptyList(),
                    clock.instant(),
                    0, 0, 0
            );
        }

        Instant now = clock.instant();
        Instant start = room.getEventStart() != null ? room.getEventStart() : now.minus(Duration.ofHours(12));
        Instant end = room.getEventEnd() != null ? room.getEventEnd() : start.plus(Duration.ofHours(48));

        long totalWeight = 0;
        for (Task t : tasks) {
            totalWeight += (t.getEstimateMin() > 0 ? t.getEstimateMin() : 60);
        }
        if (totalWeight <= 0) totalWeight = 60 * tasks.size();

        List<ProgressPointDto> planned = new ArrayList<>();
        List<ProgressPointDto> actual = new ArrayList<>();

        Instant cursor = start.truncatedTo(ChronoUnit.HOURS);
        Instant hourlyEnd = end.truncatedTo(ChronoUnit.HOURS);
        Instant nowTrunc = now.truncatedTo(ChronoUnit.HOURS);

        while (!cursor.isAfter(hourlyEnd)) {
            long plannedWeightAtT = 0;
            for (Task t : tasks) {
                if (t.getDueAt() != null && !t.getDueAt().isAfter(cursor)) {
                    plannedWeightAtT += (t.getEstimateMin() > 0 ? t.getEstimateMin() : 60);
                }
            }
            int plannedPct = (int) Math.min(100, Math.round((plannedWeightAtT * 100.0) / totalWeight));
            planned.add(new ProgressPointDto(cursor, plannedPct));

            if (!cursor.isAfter(nowTrunc)) {
                long actualWeightAtT = 0;
                for (Task t : tasks) {
                    if ("DONE".equalsIgnoreCase(t.getStatus()) && t.getCompletedAt() != null && !t.getCompletedAt().isAfter(cursor)) {
                        actualWeightAtT += (t.getEstimateMin() > 0 ? t.getEstimateMin() : 60);
                    }
                }
                int actualPct = (int) Math.min(100, Math.round((actualWeightAtT * 100.0) / totalWeight));
                actual.add(new ProgressPointDto(cursor, actualPct));
            }

            cursor = cursor.plus(1, ChronoUnit.HOURS);
        }

        long actualNowWeight = 0;
        long plannedNowWeight = 0;
        for (Task t : tasks) {
            int w = t.getEstimateMin() > 0 ? t.getEstimateMin() : 60;
            if ("DONE".equalsIgnoreCase(t.getStatus())) {
                actualNowWeight += w;
            }
            if (t.getDueAt() != null && !t.getDueAt().isAfter(now)) {
                plannedNowWeight += w;
            }
        }

        int actualNowPct = (int) Math.min(100, Math.round((actualNowWeight * 100.0) / totalWeight));
        int plannedNowPct = (int) Math.min(100, Math.round((plannedNowWeight * 100.0) / totalWeight));
        int deltaPct = actualNowPct - plannedNowPct;

        return new ProgressResultDto(
                true,
                planned,
                actual,
                now,
                deltaPct,
                actualNowPct,
                plannedNowPct
        );
    }
}
