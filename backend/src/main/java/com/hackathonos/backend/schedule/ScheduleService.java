package com.hackathonos.backend.schedule;

import com.hackathonos.backend.checkpoints.RoomCheckpoint;
import com.hackathonos.backend.checkpoints.RoomCheckpointRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Service managing sprint phases blocks, checkpoint deadlines, and team schedule events.
 */
@Service
public class ScheduleService {

    private final ScheduleEventRepository eventRepository;
    private final PlanPhaseRepository phaseRepository;
    private final RoomCheckpointRepository checkpointRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomAccess roomAccess;

    public ScheduleService(
            ScheduleEventRepository eventRepository,
            PlanPhaseRepository phaseRepository,
            RoomCheckpointRepository checkpointRepository,
            RoomRepository roomRepository,
            RoomMemberRepository memberRepository,
            RoomAccess roomAccess
    ) {
        this.eventRepository = eventRepository;
        this.phaseRepository = phaseRepository;
        this.checkpointRepository = checkpointRepository;
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.roomAccess = roomAccess;
    }

    /**
     * Gets sprint phase blocks, checkpoint deadlines, and team calendar events.
     */
    @Transactional(readOnly = true)
    public ScheduleDtos.ScheduleResponse getSchedule(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomRepository.findById(roomId).orElseThrow();

        Instant now = Instant.now();
        Instant eventStart = room.getEventStart() != null ? room.getEventStart() : room.getCreatedAt();
        Instant eventEnd = room.getEventEnd() != null ? room.getEventEnd() : eventStart.plus(Duration.ofHours(24));
        long totalMinutes = Math.max(1, Duration.between(eventStart, eventEnd).toMinutes());

        // Blocks from sprint phases
        List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<ScheduleDtos.ScheduleBlockDto> blocks = new ArrayList<>();
        for (PlanPhase p : phases) {
            double startPct = p.getStartPct().doubleValue() / 100.0;
            double endPct = p.getEndPct().doubleValue() / 100.0;
            Instant blockStart = eventStart.plus(Duration.ofMinutes((long) (totalMinutes * startPct)));
            Instant blockEnd = eventStart.plus(Duration.ofMinutes((long) (totalMinutes * endPct)));
            blocks.add(new ScheduleDtos.ScheduleBlockDto(p.getName(), blockStart, blockEnd));
        }

        // Checkpoints
        List<RoomCheckpoint> checkpoints = checkpointRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<ScheduleDtos.ScheduleCheckpointDto> cpDtos = checkpoints.stream().map(c -> {
            String status = (c.getPassedAt() != null) ? "PASSED" : (c.getDueAt() != null && now.isAfter(c.getDueAt()) ? "OVERDUE" : "PENDING");
            return new ScheduleDtos.ScheduleCheckpointDto(c.getTitle(), c.getDueAt(), status);
        }).toList();

        // Custom events
        List<ScheduleEvent> events = eventRepository.findByRoomIdOrderByStartsAtAsc(roomId);
        List<ScheduleDtos.ScheduleEventDto> eventDtos = events.stream().map(this::toDto).toList();

        return new ScheduleDtos.ScheduleResponse(blocks, cpDtos, eventDtos, now);
    }

    /**
     * Creates a new team calendar sync or milestone event.
     */
    @Transactional
    public ScheduleDtos.ScheduleEventDto createEvent(UUID roomId, User user, ScheduleDtos.CreateEventRequest req) {
        roomAccess.requireMember(roomId, user);
        validateTimes(req.startsAt(), req.endsAt());
        if (req.title() == null || req.title().isBlank()) {
            throw new BadRequestException("INVALID_TITLE", "Event title cannot be empty");
        }

        String kind = req.kind() != null ? req.kind().trim().toUpperCase(Locale.ROOT) : "SYNC";
        ScheduleEvent event = new ScheduleEvent(
                roomId,
                req.title().trim(),
                kind,
                req.startsAt(),
                req.endsAt(),
                req.notes() != null ? req.notes().trim() : "",
                user.getId()
        );
        ScheduleEvent saved = eventRepository.save(event);
        return toDto(saved);
    }

    /**
     * Updates an existing event; creator or room leader only.
     */
    @Transactional
    public ScheduleDtos.ScheduleEventDto updateEvent(UUID roomId, UUID eventId, User user, ScheduleDtos.UpdateEventRequest req) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        ScheduleEvent event = eventRepository.findById(eventId)
                .filter(e -> e.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("EVENT_NOT_FOUND", "Event not found"));

        boolean isLeader = "leader".equalsIgnoreCase(member.getRole());
        boolean isCreator = user.getId().equals(event.getCreatedBy());
        if (!isLeader && !isCreator) {
            throw new ForbiddenException("CANNOT_EDIT_EVENT", "Only the event creator or room leader can edit this event");
        }

        if (req.startsAt() != null || req.endsAt() != null) {
            Instant s = req.startsAt() != null ? req.startsAt() : event.getStartsAt();
            Instant e = req.endsAt() != null ? req.endsAt() : event.getEndsAt();
            validateTimes(s, e);
            event.setStartsAt(s);
            event.setEndsAt(e);
        }

        if (req.title() != null && !req.title().isBlank()) event.setTitle(req.title().trim());
        if (req.kind() != null) event.setKind(req.kind().trim().toUpperCase(Locale.ROOT));
        if (req.notes() != null) event.setNotes(req.notes().trim());

        ScheduleEvent saved = eventRepository.save(event);
        return toDto(saved);
    }

    /**
     * Deletes a calendar event; creator or room leader only.
     */
    @Transactional
    public void deleteEvent(UUID roomId, UUID eventId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        ScheduleEvent event = eventRepository.findById(eventId)
                .filter(e -> e.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("EVENT_NOT_FOUND", "Event not found"));

        boolean isLeader = "leader".equalsIgnoreCase(member.getRole());
        boolean isCreator = user.getId().equals(event.getCreatedBy());
        if (!isLeader && !isCreator) {
            throw new ForbiddenException("CANNOT_DELETE_EVENT", "Only the event creator or room leader can delete this event");
        }

        eventRepository.delete(event);
    }

    private void validateTimes(Instant startsAt, Instant endsAt) {
        if (startsAt == null || endsAt == null) {
            throw new BadRequestException("INVALID_EVENT_TIMES", "Event startsAt and endsAt must be specified");
        }
        if (!endsAt.isAfter(startsAt)) {
            throw new BadRequestException("INVALID_EVENT_TIMES", "Event endsAt must be strictly after startsAt");
        }
    }

    private ScheduleDtos.ScheduleEventDto toDto(ScheduleEvent e) {
        String colorRef = switch (e.getKind()) {
            case "DEADLINE" -> "bg-coral-100";
            case "CHECKPOINT" -> "bg-lav-100";
            case "MILESTONE" -> "bg-peach-100";
            default -> "bg-sky-100";
        };

        return new ScheduleDtos.ScheduleEventDto(
                e.getId(),
                e.getTitle(),
                e.getKind(),
                e.getKind(),
                e.getStartsAt(),
                e.getEndsAt(),
                e.getStartsAt(),
                e.getEndsAt(),
                e.getNotes(),
                colorRef
        );
    }
}
