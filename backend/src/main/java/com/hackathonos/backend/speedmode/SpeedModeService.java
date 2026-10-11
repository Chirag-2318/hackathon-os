package com.hackathonos.backend.speedmode;

import com.hackathonos.backend.checkpoints.dto.CheckpointDtos;
import com.hackathonos.backend.checkpoints.CheckpointService;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.overview.ClockService;
import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.speedmode.SpeedModeDtos.*;
import com.hackathonos.backend.tasks.*;
import com.hackathonos.backend.tasks.dto.MoveTaskRequest;
import com.hackathonos.backend.tasks.dto.MoveTaskResponseDto;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class SpeedModeService {

    private final RoomAccess roomAccess;
    private final TaskRepository taskRepository;
    private final TaskAcceptanceItemRepository acceptanceRepository;
    private final TaskService taskService;
    private final ClockService clockService;
    private final PlanPhaseRepository phaseRepository;
    private final CheckpointService checkpointService;
    private final SpeedModeCaptureRepository captureRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public SpeedModeService(
            RoomAccess roomAccess,
            TaskRepository taskRepository,
            TaskAcceptanceItemRepository acceptanceRepository,
            TaskService taskService,
            ClockService clockService,
            PlanPhaseRepository phaseRepository,
            CheckpointService checkpointService,
            SpeedModeCaptureRepository captureRepository,
            UserRepository userRepository,
            Clock clock
    ) {
        this.roomAccess = roomAccess;
        this.taskRepository = taskRepository;
        this.acceptanceRepository = acceptanceRepository;
        this.taskService = taskService;
        this.clockService = clockService;
        this.phaseRepository = phaseRepository;
        this.checkpointService = checkpointService;
        this.captureRepository = captureRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    /**
     * Resolves the focused Speed Mode dashboard for high-velocity solo execution.
     */
    @Transactional(readOnly = true)
    public SpeedModeResponseDto getSpeedMode(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        Instant now = clock.instant();

        List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);
        ClockService.ClockCalculation clockCalc = clockService.calculate(room, phases);

        SpeedModeClockDto clockDto = new SpeedModeClockDto(
                clockCalc.clockStatus().endsAt(),
                clockCalc.clockStatus().hoursLeft(),
                clockCalc.clockStatus().minutesLeft(),
                clockCalc.clockStatus().status(),
                clockCalc.currentPhase()
        );

        List<Task> allMyTasks = taskRepository.findByRoomId(roomId);
        List<Task> myOpen = new ArrayList<>();
        for (Task t : allMyTasks) {
            if (user.getId().equals(t.getAssigneeId()) && !"done".equalsIgnoreCase(t.getStatus())) {
                myOpen.add(t);
            }
        }

        Task currentTaskEntity = null;
        for (Task t : myOpen) {
            if ("inprogress".equalsIgnoreCase(t.getStatus())) {
                if (currentTaskEntity == null || t.getPosition() < currentTaskEntity.getPosition()) {
                    currentTaskEntity = t;
                }
            }
        }
        if (currentTaskEntity == null) {
            for (Task t : myOpen) {
                if ("todo".equalsIgnoreCase(t.getStatus())) {
                    if (currentTaskEntity == null || t.getPosition() < currentTaskEntity.getPosition()) {
                        currentTaskEntity = t;
                    }
                }
            }
        }

        SpeedModeTaskDto currentTaskDto = currentTaskEntity != null ? toTaskDto(currentTaskEntity) : null;

        List<Task> queueEntities = new ArrayList<>();
        for (Task t : myOpen) {
            if (currentTaskEntity == null || !t.getId().equals(currentTaskEntity.getId())) {
                queueEntities.add(t);
            }
        }
        queueEntities.sort(Comparator.comparingInt(Task::getPosition));

        List<SpeedModeTaskDto> queue = new ArrayList<>();
        for (int i = 0; i < Math.min(3, queueEntities.size()); i++) {
            queue.add(toTaskDto(queueEntities.get(i)));
        }

        // Blockers
        List<Task> blockedTasks = taskRepository.findByRoomIdAndFlaggedTrueAndStatusNot(roomId, "DONE");
        Set<UUID> ownerIds = new HashSet<>();
        for (Task t : blockedTasks) if (t.getAssigneeId() != null) ownerIds.add(t.getAssigneeId());
        Map<UUID, User> userMap = new HashMap<>();
        for (User u : userRepository.findAllById(ownerIds)) userMap.put(u.getId(), u);

        List<SpeedModeBlockerDto> blockers = new ArrayList<>();
        for (Task t : blockedTasks) {
            User u = userMap.get(t.getAssigneeId());
            String ownerName = u != null ? u.getName() : "Unassigned";
            blockers.add(new SpeedModeBlockerDto(
                    t.getId(),
                    t.getTaskKey(),
                    t.getSummary(),
                    t.getSummary(),
                    t.getBlockedReason() != null ? t.getBlockedReason() : "Blocked",
                    ownerName,
                    ownerName
            ));
        }

        // Captures
        List<SpeedModeCapture> captureList = captureRepository.findByRoomIdAndUserIdOrderByCreatedAtDesc(roomId, user.getId());
        List<SpeedModeCaptureDto> captures = new ArrayList<>();
        for (int i = 0; i < Math.min(5, captureList.size()); i++) {
            SpeedModeCapture c = captureList.get(i);
            captures.add(new SpeedModeCaptureDto(c.getId(), c.getText(), c.getCreatedAt()));
        }

        // Categories
        int urgentCount = blockedTasks.size();
        int buildCount = 0, docsCount = 0, pitchCount = 0;
        for (Task t : allMyTasks) {
            String role = t.getRole() != null ? t.getRole().toLowerCase() : "";
            String summ = t.getSummary() != null ? t.getSummary().toLowerCase() : "";
            if (role.contains("domain") || summ.contains("doc")) docsCount++;
            else if (role.contains("present") || summ.contains("pitch") || summ.contains("demo")) pitchCount++;
            else buildCount++;
        }

        List<SpeedModeCategoryDto> categories = List.of(
                new SpeedModeCategoryDto("urgent", "Urgent", urgentCount),
                new SpeedModeCategoryDto("build", "Build", buildCount),
                new SpeedModeCategoryDto("docs", "Docs", docsCount),
                new SpeedModeCategoryDto("pitch", "Pitch", pitchCount)
        );

        // Next checkpoint
        CheckpointDtos.CheckpointsResponseDto cps = checkpointService.getCheckpoints(roomId, user);
        CheckpointDtos.CheckpointItemDto nextCp = cps != null ? cps.next() : null;
        String cpLabel = nextCp != null ? nextCp.title() : "Feature Freeze";
        String cpEndsAt = (nextCp != null && nextCp.dueAt() != null)
                ? nextCp.dueAt().toString()
                : clockDto.endsAt().toString();
        SpeedModeCheckpointDto nextCheckpointDto = new SpeedModeCheckpointDto(cpLabel, cpEndsAt);

        String timeToSubmission = clockDto.hoursLeft() + "h " + clockDto.minutesLeft() + "m";
        String timeToCheckpoint = timeToSubmission;
        if (nextCp != null && nextCp.dueAt() != null) {
            long sec = Math.max(0, Duration.between(now, nextCp.dueAt()).toSeconds());
            timeToCheckpoint = (sec / 3600) + "h " + ((sec % 3600) / 60) + "m";
        }

        return new SpeedModeResponseDto(
                clockDto,
                currentTaskDto,
                queue,
                queue,
                blockers,
                captures,
                categories,
                timeToSubmission,
                timeToCheckpoint,
                nextCheckpointDto,
                now
        );
    }

    /**
     * Marks caller's active task done and returns the next task in queue with updated summary.
     */
    @Transactional
    public DoneTaskResponseDto markTaskDone(UUID roomId, UUID taskId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        if (!task.getRoomId().equals(roomId)) {
            throw new NotFoundException("TASK_NOT_FOUND", "Task not found in this room");
        }

        boolean isLeader = "leader".equalsIgnoreCase(member.getRole());
        boolean isAssignee = user.getId().equals(task.getAssigneeId());
        if (!isLeader && !isAssignee) {
            throw new ForbiddenException("CANNOT_COMPLETE_TASK", "Only assignee or leader can mark task done");
        }

        MoveTaskResponseDto moveResult = taskService.moveTask(roomId, user, taskId, new MoveTaskRequest("done", 0));

        // Pick next task for caller
        List<Task> myOpen = new ArrayList<>();
        for (Task t : taskRepository.findByRoomId(roomId)) {
            if (user.getId().equals(t.getAssigneeId()) && !"done".equalsIgnoreCase(t.getStatus())) {
                myOpen.add(t);
            }
        }
        myOpen.sort(Comparator.comparingInt(Task::getPosition));
        SpeedModeTaskDto nextDto = myOpen.isEmpty() ? null : toTaskDto(myOpen.get(0));

        return new DoneTaskResponseDto(nextDto, moveResult.summary());
    }

    /**
     * Saves a quick scratchpad note for the caller.
     */
    @Transactional
    public SpeedModeCaptureDto capture(UUID roomId, String text, User user) {
        roomAccess.requireMember(roomId, user);
        if (text == null || text.trim().isEmpty() || text.length() > 500) {
            throw new BadRequestException("INVALID_TEXT", "Capture text must be between 1 and 500 characters");
        }

        SpeedModeCapture c = new SpeedModeCapture(roomId, user.getId(), text.trim());
        c = captureRepository.save(c);
        return new SpeedModeCaptureDto(c.getId(), c.getText(), c.getCreatedAt());
    }

    /**
     * Lists recent scratchpad captures for the caller.
     */
    @Transactional(readOnly = true)
    public List<SpeedModeCaptureDto> listCaptures(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        List<SpeedModeCapture> list = captureRepository.findByRoomIdAndUserIdOrderByCreatedAtDesc(roomId, user.getId());
        List<SpeedModeCaptureDto> dtos = new ArrayList<>();
        for (SpeedModeCapture c : list) {
            dtos.add(new SpeedModeCaptureDto(c.getId(), c.getText(), c.getCreatedAt()));
        }
        return dtos;
    }

    /**
     * Deletes a scratchpad note by owner or leader.
     */
    @Transactional
    public void deleteCapture(UUID roomId, UUID captureId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        SpeedModeCapture c = captureRepository.findById(captureId)
                .orElseThrow(() -> new NotFoundException("CAPTURE_NOT_FOUND", "Note not found"));

        boolean isLeader = "leader".equalsIgnoreCase(member.getRole());
        boolean isOwner = user.getId().equals(c.getUserId());
        if (!isLeader && !isOwner) {
            throw new ForbiddenException("CANNOT_DELETE_CAPTURE", "Only owner or leader can delete this note");
        }

        captureRepository.delete(c);
    }

    private SpeedModeTaskDto toTaskDto(Task t) {
        List<TaskAcceptanceItem> items = acceptanceRepository.findByTaskIdOrderByPositionAsc(t.getId());
        List<SpeedModeChecklistItemDto> checklist = new ArrayList<>();
        int doneCount = 0;
        for (TaskAcceptanceItem item : items) {
            if (item.isDone()) doneCount++;
            checklist.add(new SpeedModeChecklistItemDto(
                    item.getId(),
                    item.getText(),
                    item.getText(),
                    item.isDone(),
                    item.isDone()
            ));
        }

        String category = "build";
        if (t.isFlagged()) category = "urgent";
        else if (t.getRole() != null && t.getRole().toLowerCase().contains("present")) category = "pitch";
        else if (t.getRole() != null && t.getRole().toLowerCase().contains("domain")) category = "docs";

        return new SpeedModeTaskDto(
                t.getId(),
                t.getTaskKey(),
                t.getSummary(),
                t.getSummary(),
                t.getEstimateMin(),
                checklist,
                checklist,
                doneCount,
                category
        );
    }
}
