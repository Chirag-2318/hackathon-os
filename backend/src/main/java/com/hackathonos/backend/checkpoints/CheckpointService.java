package com.hackathonos.backend.checkpoints;

import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.checkpoints.dto.CheckpointDtos.*;
import com.hackathonos.backend.mvp.MvpState;
import com.hackathonos.backend.mvp.MvpStateRepository;
import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class CheckpointService {

    private static final Set<String> AUTO_RULES = Set.of(
            "RULES_CONFIRMED", "IDEA_LOCKED", "CORE_FLOW_RUNS", "FEATURE_FREEZE"
    );

    private final RoomCheckpointRepository checkpointRepository;
    private final PlanPhaseRepository phaseRepository;
    private final MvpStateRepository mvpStateRepository;
    private final com.hackathonos.backend.pitch.PitchRehearsalRepository rehearsalRepository;
    private final com.hackathonos.backend.demo.DemoMediaRepository demoMediaRepository;
    private final com.hackathonos.backend.submission.SubmissionRepository submissionRepository;
    private final RoomAccess roomAccess;
    private final Clock clock;
    private final com.hackathonos.backend.events.RoomEventService roomEventService;

    public CheckpointService(
            RoomCheckpointRepository checkpointRepository,
            PlanPhaseRepository phaseRepository,
            MvpStateRepository mvpStateRepository,
            com.hackathonos.backend.pitch.PitchRehearsalRepository rehearsalRepository,
            com.hackathonos.backend.demo.DemoMediaRepository demoMediaRepository,
            com.hackathonos.backend.submission.SubmissionRepository submissionRepository,
            RoomAccess roomAccess,
            Clock clock,
            com.hackathonos.backend.events.RoomEventService roomEventService
    ) {
        this.checkpointRepository = checkpointRepository;
        this.phaseRepository = phaseRepository;
        this.mvpStateRepository = mvpStateRepository;
        this.rehearsalRepository = rehearsalRepository;
        this.demoMediaRepository = demoMediaRepository;
        this.submissionRepository = submissionRepository;
        this.roomAccess = roomAccess;
        this.clock = clock;
        this.roomEventService = roomEventService;
    }

    /**
     * Initializes the standard 7 hackathon checkpoints for a room if not already seeded.
     */
    @Transactional
    public void createForRoom(Room room) {
        List<RoomCheckpoint> existing = checkpointRepository.findByRoomIdOrderByPositionAsc(room.getId());
        if (!existing.isEmpty()) return;

        Instant start = room.getEventStart() != null ? room.getEventStart() : clock.instant();
        Instant end = room.getEventEnd() != null ? room.getEventEnd() : start.plus(Duration.ofHours(48));
        long totalSecs = Math.max(1, Duration.between(start, end).toSeconds());

        List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(room.getId());
        Instant freezeDue = computePhaseDue(phases, "freeze", start, totalSecs, 0.60, true);
        Instant rehearsalDue = computePhaseDue(phases, "rehearsal", start, totalSecs, 0.90, false);
        Instant videoDue = start.plusSeconds((long) (totalSecs * 0.93));

        List<RoomCheckpoint> list = List.of(
                new RoomCheckpoint(room.getId(), 0, "RULES_CONFIRMED", "Rules confirmed",
                        "Brief rubric, constraints, and judging criteria confirmed by team", null, null, null, null),
                new RoomCheckpoint(room.getId(), 1, "IDEA_LOCKED", "Idea locked",
                        "Primary problem and solution angle approved for the sprint", null, null, null, null),
                new RoomCheckpoint(room.getId(), 2, "CORE_FLOW_RUNS", "Core flow runs end to end",
                        "Main user journey executes end-to-end without mocking failures", null, null, null, null),
                new RoomCheckpoint(room.getId(), 3, "FEATURE_FREEZE", "Feature freeze",
                        "No new features; team transitions entirely to polish, bug fixes, and demo prep", null, freezeDue, null, null),
                new RoomCheckpoint(room.getId(), 4, "DEMO_REHEARSED", "Demo rehearsed 3 times",
                        "Full timed run-throughs completed with transitions and audio/screen checks", "DEMO", rehearsalDue, 0, 3),
                new RoomCheckpoint(room.getId(), 5, "VIDEO_RECORDED", "Demo video recorded and fallback saved",
                        "High-resolution walkthrough exported and backup offline copy verified", "VIDEO", videoDue, null, null),
                new RoomCheckpoint(room.getId(), 6, "SUBMISSION_VERIFIED", "Submission verified",
                        "Project links, repositories, and submission form validated against rubric", "SUBMIT", end, null, null)
        );
        checkpointRepository.saveAll(list);
    }

    /**
     * Evaluates automatic checkpoint conditions based on stage progress, MVP health, time, and rehearsal targets.
     */
    @Transactional
    public void evaluate(Room room) {
        List<RoomCheckpoint> items = checkpointRepository.findByRoomIdOrderByPositionAsc(room.getId());
        if (items.isEmpty()) return;

        Instant now = clock.instant();
        boolean mvpRuns = mvpStateRepository.findById(room.getId()).map(MvpState::isHealthRuns).orElse(false);

        for (RoomCheckpoint cp : items) {
            switch (cp.getRuleKey()) {
                case "RULES_CONFIRMED" -> applyAutoRule(cp, room.isBriefDone(), now);
                case "IDEA_LOCKED" -> applyAutoRule(cp, room.isIdeateDone(), now);
                case "CORE_FLOW_RUNS" -> applyAutoRule(cp, mvpRuns, now);
                case "FEATURE_FREEZE" -> {
                    boolean timePassed = cp.getDueAt() != null && now.isAfter(cp.getDueAt());
                    applyAutoRule(cp, timePassed, now);
                }
                case "DEMO_REHEARSED" -> {
                    long runs = rehearsalRepository.countByRoomId(room.getId());
                    cp.setProgressCurrent((int) runs);
                    boolean reached = cp.getProgressTarget() != null && runs >= cp.getProgressTarget();
                    applyAutoRule(cp, reached, now);
                }
                case "VIDEO_RECORDED" -> {
                    boolean videoRecorded = demoMediaRepository.findByRoomId(room.getId())
                            .map(m -> m.getVideoUrl() != null && !m.getVideoUrl().isBlank()
                                    && m.getFallbackUrl() != null && !m.getFallbackUrl().isBlank())
                            .orElse(false);
                    applyAutoRule(cp, videoRecorded, now);
                }
                case "SUBMISSION_VERIFIED" -> {
                    boolean subVerified = submissionRepository.findByRoomId(room.getId())
                            .map(s -> "VERIFIED".equalsIgnoreCase(s.getStatus()) || "SUBMITTED".equalsIgnoreCase(s.getStatus()))
                            .orElse(false);
                    applyAutoRule(cp, subVerified, now);
                }
            }
            checkpointRepository.save(cp);
        }
    }

    /**
     * Returns all checkpoints for the room with current, passed, and upcoming tags.
     */
    @Transactional
    public CheckpointsResponseDto getCheckpoints(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        createForRoom(room);
        evaluate(room);

        List<RoomCheckpoint> list = checkpointRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<CheckpointItemDto> itemDtos = new ArrayList<>();
        int passedCount = 0;
        boolean foundCurrent = false;
        CheckpointItemDto nextItem = null;

        for (RoomCheckpoint cp : list) {
            boolean isPassed = cp.getPassedAt() != null;
            String status;

            if (isPassed) {
                passedCount++;
                status = "passed";
            } else if (!foundCurrent) {
                status = "current";
                foundCurrent = true;
            } else {
                status = "upcoming";
            }

            CheckpointProgressDto progressDto = cp.getProgressTarget() != null
                    ? new CheckpointProgressDto(cp.getProgressCurrent() != null ? cp.getProgressCurrent() : 0, cp.getProgressTarget())
                    : null;

            CheckpointItemDto dto = new CheckpointItemDto(
                    cp.getId(),
                    cp.getRuleKey(),
                    cp.getTitle(),
                    cp.getHelper(),
                    cp.getTag(),
                    cp.getDueAt(),
                    status,
                    cp.getPassedAt(),
                    progressDto
            );
            itemDtos.add(dto);
            if ("current".equals(status)) nextItem = dto;
        }

        return new CheckpointsResponseDto(itemDtos, passedCount, list.size(), nextItem);
    }

    /**
     * Allows a team leader to manually toggle non-automated checkpoints (video, submission).
     */
    @Transactional
    public CheckpointItemDto passCheckpoint(UUID roomId, User user, UUID checkpointId, PassCheckpointRequest request) {
        roomAccess.requireLeader(roomId, user);
        RoomCheckpoint cp = checkpointRepository.findById(checkpointId)
                .orElseThrow(() -> new NotFoundException("CHECKPOINT_NOT_FOUND", "Checkpoint not found"));

        if (!cp.getRoomId().equals(roomId)) {
            throw new BadRequestException("INVALID_ROOM", "Checkpoint does not belong to this room");
        }

        if (AUTO_RULES.contains(cp.getRuleKey())) {
            throw new BadRequestException("AUTO_CHECKPOINT", "This checkpoint is automated and cannot be toggled manually");
        }

        boolean pass = request.passed() != null && request.passed();
        cp.setPassedAt(pass ? clock.instant() : null);
        cp.setPassedBy(pass ? user.getId() : null);
        cp.setAutoPassed(false);
        checkpointRepository.save(cp);
        roomEventService.recordEvent(roomId, "checkpoint.toggled", "checkpoint", cp.getId().toString(), user.getId());

        return toDto(cp, "passed");
    }

    /**
     * Updates rehearsal count for targeted checkpoints and passes upon reaching the target.
     */
    @Transactional
    public CheckpointItemDto updateProgress(UUID roomId, User user, UUID checkpointId, UpdateProgressRequest request) {
        roomAccess.requireMember(roomId, user);
        RoomCheckpoint cp = checkpointRepository.findById(checkpointId)
                .orElseThrow(() -> new NotFoundException("CHECKPOINT_NOT_FOUND", "Checkpoint not found"));

        if (!cp.getRoomId().equals(roomId)) {
            throw new BadRequestException("INVALID_ROOM", "Checkpoint does not belong to this room");
        }
        if (cp.getProgressTarget() == null) {
            throw new BadRequestException("NO_TARGET", "Checkpoint does not track numerical progress");
        }

        int current = request.current() != null ? Math.max(0, request.current()) : 0;
        cp.setProgressCurrent(current);

        if (current >= cp.getProgressTarget()) {
            cp.setPassedAt(clock.instant());
            cp.setPassedBy(user.getId());
            cp.setAutoPassed(true);
        } else if (cp.isAutoPassed()) {
            cp.setPassedAt(null);
            cp.setPassedBy(null);
            cp.setAutoPassed(false);
        }
        checkpointRepository.save(cp);

        return toDto(cp, cp.getPassedAt() != null ? "passed" : "current");
    }

    private void applyAutoRule(RoomCheckpoint cp, boolean condition, Instant now) {
        if (condition && cp.getPassedAt() == null) {
            cp.setPassedAt(now);
            cp.setAutoPassed(true);
        } else if (!condition && cp.isAutoPassed()) {
            cp.setPassedAt(null);
            cp.setAutoPassed(false);
            cp.setPassedBy(null);
        }
    }

    private Instant computePhaseDue(List<PlanPhase> phases, String keyword, Instant start, long totalSecs, double defaultRatio, boolean useStart) {
        for (PlanPhase p : phases) {
            if (p.getName().toLowerCase().contains(keyword)) {
                double pct = useStart
                        ? (p.getStartPct() != null ? p.getStartPct().doubleValue() : 0.0)
                        : (p.getEndPct() != null ? p.getEndPct().doubleValue() : 100.0);
                return start.plusSeconds((long) (totalSecs * (pct / 100.0)));
            }
        }
        return start.plusSeconds((long) (totalSecs * defaultRatio));
    }

    private CheckpointItemDto toDto(RoomCheckpoint cp, String status) {
        CheckpointProgressDto prog = cp.getProgressTarget() != null
                ? new CheckpointProgressDto(cp.getProgressCurrent() != null ? cp.getProgressCurrent() : 0, cp.getProgressTarget())
                : null;
        return new CheckpointItemDto(
                cp.getId(), cp.getRuleKey(), cp.getTitle(), cp.getHelper(), cp.getTag(),
                cp.getDueAt(), status, cp.getPassedAt(), prog
        );
    }
}
