package com.hackathonos.backend.overview;

import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.tasks.dto.TaskPhaseSummaryDto;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class ClockService {

    public record TimelineSegmentDto(
            String name,
            Instant startAt,
            Instant endAt,
            int startPct,
            int endPct,
            String state // "done", "current", "upcoming"
    ) {}

    public record ClockStatusDto(
            String label,
            Instant endsAt,
            long hoursLeft,
            long minutesLeft,
            String status, // NOT_STARTED, ON_TRACK, DUE_SOON, FINAL_STRETCH, ENDED
            Instant startsAt,
            long hourOfEvent,
            long totalHours
    ) {}

    public record ClockCalculation(
            ClockStatusDto clockStatus,
            double elapsedPct,
            TaskPhaseSummaryDto currentPhase,
            List<TimelineSegmentDto> timeline
    ) {}

    private final Clock clock;

    public ClockService(Clock clock) {
        this.clock = clock;
    }

    /**
     * Computes timeline, countdown status, phase segment, and remaining time from event start and end.
     */
    public ClockCalculation calculate(Room room, List<PlanPhase> phases) {
        Instant now = clock.instant();
        Instant start = room.getEventStart() != null ? room.getEventStart() : now;
        Instant end = room.getEventEnd() != null ? room.getEventEnd() : start.plus(Duration.ofHours(48));

        long totalSeconds = Math.max(1, Duration.between(start, end).toSeconds());
        long totalHours = Math.max(1, Duration.between(start, end).toHours());

        double elapsedPct;
        if (now.isBefore(start)) {
            elapsedPct = 0.0;
        } else if (now.isAfter(end)) {
            elapsedPct = 100.0;
        } else {
            long elapsedSeconds = Duration.between(start, now).toSeconds();
            elapsedPct = Math.min(100.0, Math.max(0.0, (elapsedSeconds * 100.0) / totalSeconds));
        }

        long hoursElapsed = Math.max(0, Duration.between(start, now.isAfter(end) ? end : now).toHours());
        long hourOfEvent = Math.min(totalHours, hoursElapsed + 1);

        long secondsLeft = Math.max(0, Duration.between(now, end).toSeconds());
        long hoursLeft = secondsLeft / 3600;
        long minutesLeft = (secondsLeft % 3600) / 60;
        double remainingPct = 100.0 - elapsedPct;

        String status;
        if (now.isBefore(start)) {
            status = "NOT_STARTED";
        } else if (now.isAfter(end)) {
            status = "ENDED";
        } else if (remainingPct > 25.0) {
            status = "ON_TRACK";
        } else if (remainingPct >= 10.0) {
            status = "DUE_SOON";
        } else {
            status = "FINAL_STRETCH";
        }

        ClockStatusDto statusDto = new ClockStatusDto(
                "Submission closes",
                end,
                hoursLeft,
                minutesLeft,
                status,
                start,
                hourOfEvent,
                totalHours
        );

        TaskPhaseSummaryDto currentPhase = null;
        List<TimelineSegmentDto> timeline = new ArrayList<>();

        if (phases != null && !phases.isEmpty()) {
            for (PlanPhase p : phases) {
                double sPct = p.getStartPct() != null ? p.getStartPct().doubleValue() : 0.0;
                double ePct = p.getEndPct() != null ? p.getEndPct().doubleValue() : 100.0;
                Instant pStart = start.plusSeconds((long) (totalSeconds * (sPct / 100.0)));
                Instant pEnd = start.plusSeconds((long) (totalSeconds * (ePct / 100.0)));

                String segState;
                if (now.isBefore(start)) {
                    segState = "upcoming";
                } else if (elapsedPct >= ePct) {
                    segState = "done";
                } else if (elapsedPct >= sPct) {
                    segState = "current";
                    currentPhase = new TaskPhaseSummaryDto(p.getId(), p.getName(), pStart, pEnd);
                } else {
                    segState = "upcoming";
                }

                timeline.add(new TimelineSegmentDto(
                        p.getName(),
                        pStart,
                        pEnd,
                        (int) Math.round(sPct),
                        (int) Math.round(ePct),
                        segState
                ));
            }

            if (currentPhase == null) {
                if (now.isAfter(end)) {
                    PlanPhase last = phases.get(phases.size() - 1);
                    currentPhase = new TaskPhaseSummaryDto(last.getId(), last.getName(), start, end);
                } else {
                    PlanPhase first = phases.get(0);
                    currentPhase = new TaskPhaseSummaryDto(first.getId(), first.getName(), start, end);
                }
            }
        }

        return new ClockCalculation(statusDto, elapsedPct, currentPhase, timeline);
    }
}
