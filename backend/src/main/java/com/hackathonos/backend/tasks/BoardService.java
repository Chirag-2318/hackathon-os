package com.hackathonos.backend.tasks;

import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.github.GithubBranchTask;
import com.hackathonos.backend.github.GithubBranchTaskRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.overview.ClockService;
import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.tasks.dto.*;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BoardService {

    private final TaskRepository taskRepository;
    private final SubtaskRepository subtaskRepository;
    private final TaskAcceptanceItemRepository acceptanceRepository;
    private final TaskLabelRepository labelRepository;
    private final TaskDependencyRepository dependencyRepository;
    private final TaskCommentRepository commentRepository;
    private final PlanPhaseRepository phaseRepository;
    private final RoomMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;
    private final TaskDtoMapper taskDtoMapper;
    private final ClockService clockService;
    private final Clock clock;
    private final GithubBranchTaskRepository branchTaskRepository;

    public BoardService(
            TaskRepository taskRepository,
            SubtaskRepository subtaskRepository,
            TaskAcceptanceItemRepository acceptanceRepository,
            TaskLabelRepository labelRepository,
            TaskDependencyRepository dependencyRepository,
            TaskCommentRepository commentRepository,
            PlanPhaseRepository phaseRepository,
            RoomMemberRepository memberRepository,
            UserRepository userRepository,
            RoomAccess roomAccess,
            TaskDtoMapper taskDtoMapper,
            ClockService clockService,
            Clock clock,
            GithubBranchTaskRepository branchTaskRepository
    ) {
        this.taskRepository = taskRepository;
        this.subtaskRepository = subtaskRepository;
        this.acceptanceRepository = acceptanceRepository;
        this.labelRepository = labelRepository;
        this.dependencyRepository = dependencyRepository;
        this.commentRepository = commentRepository;
        this.phaseRepository = phaseRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
        this.taskDtoMapper = taskDtoMapper;
        this.clockService = clockService;
        this.clock = clock;
        this.branchTaskRepository = branchTaskRepository;
    }

    /**
     * Retrieves full project Kanban board columns, summary metrics, phases, and active members.
     */
    @Transactional(readOnly = true)
    public BoardResponseDto getBoard(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        List<Task> tasks = taskRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);
        ClockService.ClockCalculation clockCalc = clockService.calculate(room, phases);

        Map<UUID, PlanPhase> phaseMap = new HashMap<>();
        List<TaskPhaseSummaryDto> phaseDtos = new ArrayList<>();
        for (PlanPhase p : phases) {
            phaseMap.put(p.getId(), p);
            phaseDtos.add(new TaskPhaseSummaryDto(p.getId(), p.getName()));
        }

        List<RoomMember> roomMembers = memberRepository.findByRoomId(roomId);
        Set<UUID> userIds = new HashSet<>();
        for (RoomMember rm : roomMembers) {
            if (rm.getUserId() != null) userIds.add(rm.getUserId());
        }
        for (Task t : tasks) {
            if (t.getAssigneeId() != null) userIds.add(t.getAssigneeId());
            if (t.getReporterId() != null) userIds.add(t.getReporterId());
        }

        Map<UUID, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (User u : userRepository.findAllById(userIds)) {
                userMap.put(u.getId(), u);
            }
        }

        List<TaskUserDto> memberDtos = new ArrayList<>();
        for (RoomMember rm : roomMembers) {
            User u = userMap.get(rm.getUserId());
            if (u != null) {
                memberDtos.add(taskDtoMapper.toUserDto(u));
            }
        }

        Map<UUID, Task> taskById = new HashMap<>();
        for (Task t : tasks) taskById.put(t.getId(), t);

        List<UUID> taskIds = new ArrayList<>(taskById.keySet());
        Map<UUID, List<Subtask>> subtaskMap = loadSubtasks(taskIds);
        Map<UUID, List<TaskAcceptanceItem>> acceptanceMap = loadAcceptance(taskIds);
        Map<UUID, List<String>> labelMap = loadLabels(taskIds);
        Map<UUID, List<TaskDependencyItemDto>> dependsOnMap = loadDependsOn(taskIds, taskById);
        Map<UUID, List<TaskDependencyItemDto>> blocksMap = loadBlocks(taskIds, taskById);
        Set<UUID> tasksWithBranch = taskIds.isEmpty() ? Collections.emptySet()
                : branchTaskRepository.findByTaskIdIn(taskIds).stream().map(GithubBranchTask::getTaskId).collect(Collectors.toSet());

        List<TaskDto> todo = new ArrayList<>();
        List<TaskDto> inprogress = new ArrayList<>();
        List<TaskDto> done = new ArrayList<>();

        Instant now = clock.instant();
        Instant in24h = now.plus(Duration.ofHours(24));
        long total = tasks.size(), open = 0, todoCount = 0, inProgCount = 0, doneCount = 0;
        long blocked = 0, unassigned = 0, dueToday = 0;

        for (Task t : tasks) {
            String normStatus = taskDtoMapper.normalizeStatus(t.getStatus());
            boolean isDone = "done".equals(normStatus);

            if (isDone) {
                doneCount++;
            } else {
                open++;
                if (t.isFlagged()) blocked++;
                if (t.getAssigneeId() == null) unassigned++;
                if (t.getDueAt() != null && !t.getDueAt().isBefore(now) && !t.getDueAt().isAfter(in24h)) {
                    dueToday++;
                }
            }

            if ("todo".equals(normStatus)) todoCount++;
            if ("inprogress".equals(normStatus)) inProgCount++;

            TaskDto dto = taskDtoMapper.toDto(
                    t,
                    phaseMap.get(t.getPhaseId()),
                    userMap.get(t.getAssigneeId()),
                    userMap.get(t.getReporterId()),
                    labelMap.get(t.getId()),
                    subtaskMap.get(t.getId()),
                    acceptanceMap.get(t.getId()),
                    dependsOnMap.get(t.getId()),
                    blocksMap.get(t.getId()),
                    0,
                    tasksWithBranch.contains(t.getId())
            );

            if ("todo".equals(normStatus)) {
                todo.add(dto);
            } else if ("inprogress".equals(normStatus)) {
                inprogress.add(dto);
            } else {
                done.add(dto);
            }
        }

        BoardSummaryDto summary = new BoardSummaryDto(
                total, open, todoCount, inProgCount, blocked, doneCount, unassigned, dueToday
        );

        return new BoardResponseDto(
                new BoardColumnsDto(todo, inprogress, done),
                memberDtos,
                phaseDtos,
                summary,
                clockCalc.currentPhase(),
                clockCalc.clockStatus().hoursLeft(),
                now
        );
    }

    private Map<UUID, List<Subtask>> loadSubtasks(List<UUID> taskIds) {
        Map<UUID, List<Subtask>> map = new HashMap<>();
        if (taskIds.isEmpty()) return map;
        for (Subtask st : subtaskRepository.findByTaskIdInOrderByPositionAsc(taskIds)) {
            map.computeIfAbsent(st.getTaskId(), k -> new ArrayList<>()).add(st);
        }
        return map;
    }

    private Map<UUID, List<TaskAcceptanceItem>> loadAcceptance(List<UUID> taskIds) {
        Map<UUID, List<TaskAcceptanceItem>> map = new HashMap<>();
        if (taskIds.isEmpty()) return map;
        for (TaskAcceptanceItem ai : acceptanceRepository.findByTaskIdInOrderByPositionAsc(taskIds)) {
            map.computeIfAbsent(ai.getTaskId(), k -> new ArrayList<>()).add(ai);
        }
        return map;
    }

    private Map<UUID, List<String>> loadLabels(List<UUID> taskIds) {
        Map<UUID, List<String>> map = new HashMap<>();
        if (taskIds.isEmpty()) return map;
        for (TaskLabel l : labelRepository.findByTaskIdIn(taskIds)) {
            map.computeIfAbsent(l.getTaskId(), k -> new ArrayList<>()).add(l.getLabel());
        }
        return map;
    }

    private Map<UUID, List<TaskDependencyItemDto>> loadDependsOn(List<UUID> taskIds, Map<UUID, Task> taskById) {
        Map<UUID, List<TaskDependencyItemDto>> map = new HashMap<>();
        if (taskIds.isEmpty()) return map;
        for (TaskDependency dep : dependencyRepository.findByTaskIdIn(taskIds)) {
            Task target = taskById.get(dep.getDependsOnTaskId());
            if (target != null) {
                map.computeIfAbsent(dep.getTaskId(), k -> new ArrayList<>()).add(
                        new TaskDependencyItemDto(target.getId(), target.getTaskKey(), target.getSummary(), taskDtoMapper.normalizeStatus(target.getStatus()))
                );
            }
        }
        return map;
    }

    private Map<UUID, List<TaskDependencyItemDto>> loadBlocks(List<UUID> taskIds, Map<UUID, Task> taskById) {
        Map<UUID, List<TaskDependencyItemDto>> map = new HashMap<>();
        if (taskIds.isEmpty()) return map;
        for (TaskDependency dep : dependencyRepository.findAll()) {
            if (taskIds.contains(dep.getDependsOnTaskId())) {
                Task blocker = taskById.get(dep.getTaskId());
                if (blocker != null) {
                    map.computeIfAbsent(dep.getDependsOnTaskId(), k -> new ArrayList<>()).add(
                            new TaskDependencyItemDto(blocker.getId(), blocker.getTaskKey(), blocker.getSummary(), taskDtoMapper.normalizeStatus(blocker.getStatus()))
                    );
                }
            }
        }
        return map;
    }
}
