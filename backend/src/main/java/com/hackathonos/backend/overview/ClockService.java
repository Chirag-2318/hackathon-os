package com.hackathonos.backend.overview;

import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomTimeService;
import com.hackathonos.backend.rooms.dto.RoomClockDto;
import com.hackathonos.backend.tasks.dto.TaskPhaseSummaryDto;
import org.springframework.stereotype.Service;

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

    private final RoomTimeService roomTimeService;

    public ClockService(RoomTimeService roomTimeService) {
        this.roomTimeService = roomTimeService;
    }

    /**
     * Computes timeline, countdown status, phase segment, and remaining time delegating to RoomTimeService.
     */
    public ClockCalculation calculate(Room room, List<PlanPhase> phases) {
        RoomClockDto clock = roomTimeService.computeClock(room);
        Instant now = clock.serverNow();
        Instant start = clock.startsAt();
        Instant end = clock.endsAt();
        int totalHours = clock.durationHours();
        double elapsedPct = clock.elapsedPercent();

        long totalSeconds = Math.max(1, Duration.between(start, end).toSeconds());
        long hoursLeft = clock.msToDeadline() / 3600_000L;
        long minutesLeft = (clock.msToDeadline() % 3600_000L) / 60_000L;
        long hourOfEvent = Math.min((long) totalHours, (long) clock.hourIndex() + 1);

        double remainingPct = 100.0 - elapsedPct;
        String status;
        if ("UPCOMING".equals(clock.clockStatus())) {
            status = "NOT_STARTED";
        } else if ("ENDED".equals(clock.clockStatus()) || "SUBMITTED".equals(clock.clockStatus())) {
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
