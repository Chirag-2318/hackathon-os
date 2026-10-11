package com.hackathonos.backend.tasks;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.github.GithubBranch;
import com.hackathonos.backend.github.GithubBranchRepository;
import com.hackathonos.backend.github.GithubBranchTask;
import com.hackathonos.backend.github.GithubBranchTaskRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final SubtaskRepository subtaskRepository;
    private final TaskAcceptanceItemRepository acceptanceRepository;
    private final TaskLabelRepository labelRepository;
    private final TaskDependencyRepository dependencyRepository;
    private final TaskCommentRepository commentRepository;
    private final TaskHistoryRepository historyRepository;
    private final PlanPhaseRepository phaseRepository;
    private final RoomMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;
    private final TaskKeyService taskKeyService;
    private final TaskDtoMapper taskDtoMapper;
    private final DependencyCycleDetector cycleDetector;
    private final ActivityLogger activityLogger;
    private final NotificationService notificationService;
    private final ClockService clockService;
    private final Clock clock;
    private final GithubBranchTaskRepository branchTaskRepository;
    private final GithubBranchRepository branchRepository;

    public TaskService(
            TaskRepository taskRepository,
            SubtaskRepository subtaskRepository,
            TaskAcceptanceItemRepository acceptanceRepository,
            TaskLabelRepository labelRepository,
            TaskDependencyRepository dependencyRepository,
            TaskCommentRepository commentRepository,
            TaskHistoryRepository historyRepository,
            PlanPhaseRepository phaseRepository,
            RoomMemberRepository memberRepository,
            UserRepository userRepository,
            RoomAccess roomAccess,
            TaskKeyService taskKeyService,
            TaskDtoMapper taskDtoMapper,
            DependencyCycleDetector cycleDetector,
            ActivityLogger activityLogger,
            NotificationService notificationService,
            ClockService clockService,
            Clock clock,
            GithubBranchTaskRepository branchTaskRepository,
            GithubBranchRepository branchRepository
    ) {
        this.taskRepository = taskRepository;
        this.subtaskRepository = subtaskRepository;
        this.acceptanceRepository = acceptanceRepository;
        this.labelRepository = labelRepository;
        this.dependencyRepository = dependencyRepository;
        this.commentRepository = commentRepository;
        this.historyRepository = historyRepository;
        this.phaseRepository = phaseRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
        this.taskKeyService = taskKeyService;
        this.taskDtoMapper = taskDtoMapper;
        this.cycleDetector = cycleDetector;
        this.activityLogger = activityLogger;
        this.notificationService = notificationService;
        this.clockService = clockService;
        this.clock = clock;
        this.branchTaskRepository = branchTaskRepository;
        this.branchRepository = branchRepository;
    }

    /**
     * Creates a new Kanban task during the build phase with auto-allocated sequential key.
     */
    @Transactional
    public TaskDetailDto createTask(UUID roomId, User user, CreateTaskRequest request) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        if (!"build".equalsIgnoreCase(room.getStage())) {
            throw new ConflictException("BUILD_NOT_STARTED", "Tasks can only be created once the build phase has started");
        }

        TaskKeyService.TaskKeyResult keyResult = taskKeyService.nextKeyResult(room);
        String internalStatus = toInternalStatus(request.status());
        int nextPosition = computeNextPosition(roomId, internalStatus);

        UUID targetPhaseId = request.phaseId();
        if (targetPhaseId == null) {
            List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);
            ClockService.ClockCalculation clockCalc = clockService.calculate(room, phases);
            if (clockCalc.currentPhase() != null) targetPhaseId = clockCalc.currentPhase().id();
        }

        Task task = new Task(
                roomId,
                keyResult.key(),
                keyResult.number(),
                request.summary().trim(),
                request.description(),
                internalStatus,
                request.assigneeId(),
                user.getId(),
                request.priority() != null ? request.priority().toUpperCase() : "MEDIUM",
                targetPhaseId,
                request.role() != null ? request.role() : "Frontend",
                request.estimateMin() != null && request.estimateMin() > 0 ? request.estimateMin() : 60,
                request.dueAt(),
                nextPosition,
                "MANUAL"
        );
        Task saved = taskRepository.save(task);

        saveLabels(saved.getId(), request.labels());
        historyRepository.save(new TaskHistory(saved.getId(), user.getId(), "Created"));
        activityLogger.log(room, user, "TASK_CREATED", "created " + saved.getTaskKey());

        notifyAssigneeIfApplicable(room, user, saved.getAssigneeId(), saved.getTaskKey());
        return getTask(roomId, user, saved.getId().toString());
    }

    /**
     * Retrieves full task details including dependencies, acceptance criteria, comments, and history.
     */
    @Transactional(readOnly = true)
    public TaskDetailDto getTask(UUID roomId, User user, String taskIdOrKey) {
        roomAccess.requireMember(roomId, user);
        Task task = resolveTask(roomId, taskIdOrKey);
        return buildTaskDetail(task, user);
    }

    /**
     * Partially updates a task while validating optimistic locking version and recording history lines.
     */
    @Transactional
    public TaskDetailDto updateTask(UUID roomId, User user, UUID taskId, UpdateTaskRequest request) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);
        Task task = taskRepository.findByIdAndRoomId(taskId, roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        if (request.version() != null && request.version() != task.getVersion()) {
            throw new TaskConflictException(buildTaskDetail(task, user));
        }

        applyFieldUpdatesAndHistory(task, request, user);
        task.setUpdatedAt(clock.instant());
        Task saved = taskRepository.save(task);

        if (request.labels() != null) {
            labelRepository.deleteByTaskId(saved.getId());
            saveLabels(saved.getId(), request.labels());
        }

        return buildTaskDetail(saved, user);
    }

    /**
     * Moves a task to a target column and index, auto-assigns on in-progress transition, and sets completion date.
     */
    @Transactional
    public MoveTaskResponseDto moveTask(UUID roomId, User user, UUID taskId, MoveTaskRequest request) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);
        Task task = taskRepository.findByIdAndRoomId(taskId, roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        String targetStatus = toInternalStatus(request.toStatus());
        String oldStatus = task.getStatus();

        if ("IN_PROGRESS".equals(targetStatus) && task.getAssigneeId() == null) {
            task.setAssigneeId(user.getId());
            historyRepository.save(new TaskHistory(task.getId(), user.getId(), "Assigned to " + user.getName() + " automatically"));
        }

        if ("DONE".equals(targetStatus) && !"DONE".equals(oldStatus)) {
            task.setCompletedAt(clock.instant());
            historyRepository.save(new TaskHistory(task.getId(), user.getId(), "moved to Done"));
            activityLogger.log(room, user, "TASK_COMPLETED", "finished " + task.getTaskKey());
        } else if (!"DONE".equals(targetStatus) && "DONE".equals(oldStatus)) {
            task.setCompletedAt(null);
            historyRepository.save(new TaskHistory(task.getId(), user.getId(), "moved to " + request.toStatus()));
        } else if (!targetStatus.equals(oldStatus)) {
            historyRepository.save(new TaskHistory(task.getId(), user.getId(), "moved to " + request.toStatus()));
        }

        task.setStatus(targetStatus);
        reorderColumnTasks(roomId, task, targetStatus, oldStatus, request.toIndex());
        task.setUpdatedAt(clock.instant());
        Task saved = taskRepository.save(task);

        BoardSummaryDto summary = computeBoardSummary(roomId);
        TaskDto movedDto = buildTaskDto(saved);
        return new MoveTaskResponseDto(summary, movedDto);
    }

    /**
     * Flags a task as blocked with a reason or removes the blocking flag, notifying team leads.
     */
    @Transactional
    public TaskDetailDto flagTask(UUID roomId, User user, UUID taskId, FlagTaskRequest request) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);
        Task task = taskRepository.findByIdAndRoomId(taskId, roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        if (request.flagged()) {
            if (request.reason() == null || request.reason().isBlank()) {
                throw new BadRequestException("REASON_REQUIRED", "A reason is required when flagging a task");
            }
            task.setFlagged(true);
            task.setBlockedReason(request.reason().trim());
            historyRepository.save(new TaskHistory(task.getId(), user.getId(), user.getName() + " flagged this task: " + task.getBlockedReason()));
            activityLogger.log(room, user, "TASK_BLOCKED", "flagged " + task.getTaskKey());
            notifyBlocked(room, user, task);
        } else {
            task.setFlagged(false);
            task.setBlockedReason(null);
            historyRepository.save(new TaskHistory(task.getId(), user.getId(), user.getName() + " removed the flag"));
        }

        task.setUpdatedAt(clock.instant());
        taskRepository.save(task);
        return buildTaskDetail(task, user);
    }

    /**
     * Reassigns a task to another active room member and records assignment history.
     */
    @Transactional
    public TaskDetailDto assignTask(UUID roomId, User user, UUID taskId, AssignTaskRequest request) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);
        Task task = taskRepository.findByIdAndRoomId(taskId, roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        if (request.assigneeId() != null) {
            memberRepository.findByRoomIdAndUserId(roomId, request.assigneeId())
                    .orElseThrow(() -> new BadRequestException("NOT_A_MEMBER", "Assignee must be a member of this room"));
        }

        UUID oldAssignee = task.getAssigneeId();
        task.setAssigneeId(request.assigneeId());
        task.setUpdatedAt(clock.instant());
        Task saved = taskRepository.save(task);

        String newName = request.assigneeId() != null ? userRepository.findById(request.assigneeId()).map(User::getName).orElse("Teammate") : null;
        String line = newName != null ? user.getName() + " assigned to " + newName : user.getName() + " unassigned this task";
        historyRepository.save(new TaskHistory(task.getId(), user.getId(), line));

        if (request.assigneeId() != null && !request.assigneeId().equals(user.getId()) && !request.assigneeId().equals(oldAssignee)) {
            userRepository.findById(request.assigneeId()).ifPresent(assignee ->
                    notificationService.notifyUser(assignee, room, NotificationType.TASK_ASSIGNED,
                            "Task Assigned", "You were assigned to " + task.getTaskKey()));
        }

        return buildTaskDetail(saved, user);
    }

    /**
     * Creates a subtask under the specified parent task.
     */
    @Transactional
    public TaskDetailDto addSubtask(UUID roomId, User user, UUID taskId, CreateSubtaskRequest request) {
        roomAccess.requireMember(roomId, user);
        Task task = taskRepository.findByIdAndRoomId(taskId, roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        List<Subtask> existing = subtaskRepository.findByTaskIdOrderByPositionAsc(taskId);
        Subtask subtask = new Subtask(taskId, request.text().trim(), false, existing.size());
        subtaskRepository.save(subtask);

        task.setUpdatedAt(clock.instant());
        taskRepository.save(task);
        return buildTaskDetail(task, user);
    }

    /**
     * Updates subtask completion status or descriptive text.
     */
    @Transactional
    public TaskDetailDto updateSubtask(UUID roomId, User user, UUID subtaskId, UpdateSubtaskRequest request) {
        roomAccess.requireMember(roomId, user);
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new NotFoundException("SUBTASK_NOT_FOUND", "Subtask not found"));
        Task task = taskRepository.findByIdAndRoomId(subtask.getTaskId(), roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        if (request.text() != null && !request.text().isBlank()) subtask.setText(request.text().trim());
        if (request.done() != null) subtask.setDone(request.done());
        subtaskRepository.save(subtask);

        task.setUpdatedAt(clock.instant());
        taskRepository.save(task);
        return buildTaskDetail(task, user);
    }

    /**
     * Deletes a subtask item from a parent task.
     */
    @Transactional
    public TaskDetailDto deleteSubtask(UUID roomId, User user, UUID subtaskId) {
        roomAccess.requireMember(roomId, user);
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new NotFoundException("SUBTASK_NOT_FOUND", "Subtask not found"));
        Task task = taskRepository.findByIdAndRoomId(subtask.getTaskId(), roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        subtaskRepository.delete(subtask);
        task.setUpdatedAt(clock.instant());
        taskRepository.save(task);
        return buildTaskDetail(task, user);
    }

    /**
     * Adds an acceptance criterion item to a task definition.
     */
    @Transactional
    public TaskDetailDto addAcceptance(UUID roomId, User user, UUID taskId, CreateAcceptanceRequest request) {
        roomAccess.requireMember(roomId, user);
        Task task = taskRepository.findByIdAndRoomId(taskId, roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        List<TaskAcceptanceItem> existing = acceptanceRepository.findByTaskIdOrderByPositionAsc(taskId);
        TaskAcceptanceItem item = new TaskAcceptanceItem(taskId, request.text().trim(), false, existing.size());
        acceptanceRepository.save(item);

        task.setUpdatedAt(clock.instant());
        taskRepository.save(task);
        return buildTaskDetail(task, user);
    }

    /**
     * Updates completion status or text of an acceptance criterion item.
     */
    @Transactional
    public TaskDetailDto updateAcceptance(UUID roomId, User user, UUID itemId, UpdateAcceptanceRequest request) {
        roomAccess.requireMember(roomId, user);
        TaskAcceptanceItem item = acceptanceRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("ITEM_NOT_FOUND", "Acceptance item not found"));
        Task task = taskRepository.findByIdAndRoomId(item.getTaskId(), roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        if (request.text() != null && !request.text().isBlank()) item.setText(request.text().trim());
        if (request.done() != null) item.setDone(request.done());
        acceptanceRepository.save(item);

        task.setUpdatedAt(clock.instant());
        taskRepository.save(task);
        return buildTaskDetail(task, user);
    }

    /**
     * Deletes an acceptance criterion item from a task.
     */
    @Transactional
    public TaskDetailDto deleteAcceptance(UUID roomId, User user, UUID itemId) {
        roomAccess.requireMember(roomId, user);
        TaskAcceptanceItem item = acceptanceRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("ITEM_NOT_FOUND", "Acceptance item not found"));
        Task task = taskRepository.findByIdAndRoomId(item.getTaskId(), roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        acceptanceRepository.delete(item);
        task.setUpdatedAt(clock.instant());
        taskRepository.save(task);
        return buildTaskDetail(task, user);
    }

    /**
     * Posts a comment on a task and alerts tagged teammates mentioned via @Name.
     */
    @Transactional
    public TaskDetailDto addComment(UUID roomId, User user, UUID taskId, CreateCommentRequest request) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);
        Task task = taskRepository.findByIdAndRoomId(taskId, roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        TaskComment comment = new TaskComment(taskId, user.getId(), request.text().trim());
        commentRepository.save(comment);

        parseAndNotifyMentions(room, user, task, request.text());
        task.setUpdatedAt(clock.instant());
        taskRepository.save(task);
        return buildTaskDetail(task, user);
    }

    /**
     * Edits an existing comment by its original author.
     */
    @Transactional
    public TaskDetailDto updateComment(UUID roomId, User user, UUID commentId, UpdateCommentRequest request) {
        roomAccess.requireMember(roomId, user);
        TaskComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("COMMENT_NOT_FOUND", "Comment not found"));
        Task task = taskRepository.findByIdAndRoomId(comment.getTaskId(), roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        if (!comment.getAuthorId().equals(user.getId())) {
            throw new ForbiddenException("AUTHOR_REQUIRED", "Only the author may edit this comment");
        }

        comment.setText(request.text().trim());
        comment.setEditedAt(clock.instant());
        commentRepository.save(comment);

        task.setUpdatedAt(clock.instant());
        taskRepository.save(task);
        return buildTaskDetail(task, user);
    }

    /**
     * Deletes a comment by author or team leader.
     */
    @Transactional
    public TaskDetailDto deleteComment(UUID roomId, User user, UUID commentId) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        TaskComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("COMMENT_NOT_FOUND", "Comment not found"));
        Task task = taskRepository.findByIdAndRoomId(comment.getTaskId(), roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        boolean isLeader = "LEADER".equalsIgnoreCase(member.getRole());
        boolean isAuthor = comment.getAuthorId().equals(user.getId());
        if (!isLeader && !isAuthor) {
            throw new ForbiddenException("NOT_AUTHORIZED", "Only the author or leader may delete this comment");
        }

        commentRepository.delete(comment);
        task.setUpdatedAt(clock.instant());
        taskRepository.save(task);
        return buildTaskDetail(task, user);
    }

    /**
     * Replaces dependencies on other tasks with cycle prevention and validation.
     */
    @Transactional
    public TaskDetailDto updateDependencies(UUID roomId, User user, UUID taskId, UpdateDependenciesRequest request) {
        roomAccess.requireMember(roomId, user);
        Task task = taskRepository.findByIdAndRoomId(taskId, roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        List<UUID> proposed = request.dependsOnTaskIds() != null ? request.dependsOnTaskIds() : Collections.emptyList();
        if (proposed.size() > 10) {
            throw new BadRequestException("TOO_MANY_DEPENDENCIES", "A task cannot depend on more than 10 tasks");
        }

        for (UUID depId : proposed) {
            if (depId.equals(taskId)) {
                throw new BadRequestException("SELF_DEPENDENCY", "A task cannot depend on itself");
            }
            Task target = taskRepository.findById(depId)
                    .orElseThrow(() -> new BadRequestException("DEPENDENCY_NOT_FOUND", "Target task not found: " + depId));
            if (!target.getRoomId().equals(roomId)) {
                throw new BadRequestException("CROSS_ROOM_DEPENDENCY", "Tasks must belong to the same room");
            }
        }

        List<TaskDependency> existingDeps = dependencyRepository.findAll();
        DependencyCycleDetector.CycleCheckResult cycleResult = cycleDetector.detectCycle(taskId, proposed, existingDeps);
        if (cycleResult.hasCycle()) {
            List<String> keys = new ArrayList<>();
            for (UUID id : cycleResult.cyclePath()) {
                taskRepository.findById(id).ifPresent(t -> keys.add(t.getTaskKey()));
            }
            throw new BadRequestException("DEPENDENCY_CYCLE", "Dependency cycle detected: " + String.join(" -> ", keys));
        }

        dependencyRepository.deleteByTaskId(taskId);
        for (UUID depId : proposed) {
            dependencyRepository.save(new TaskDependency(taskId, depId));
        }

        historyRepository.save(new TaskHistory(taskId, user.getId(), user.getName() + " updated dependencies"));
        task.setUpdatedAt(clock.instant());
        taskRepository.save(task);
        return buildTaskDetail(task, user);
    }

    /**
     * Deletes a task by room leader or original reporter, clearing all attached relations.
     */
    @Transactional
    public void deleteTask(UUID roomId, User user, UUID taskId) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        Task task = taskRepository.findByIdAndRoomId(taskId, roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        boolean isLeader = "LEADER".equalsIgnoreCase(member.getRole());
        boolean isReporter = task.getReporterId() != null && task.getReporterId().equals(user.getId());
        if (!isLeader && !isReporter) {
            throw new ForbiddenException("DELETE_FORBIDDEN", "Only the room leader or task reporter can delete this task");
        }

        dependencyRepository.deleteByTaskId(taskId);
        dependencyRepository.deleteByDependsOnTaskId(taskId);
        subtaskRepository.deleteByTaskId(taskId);
        acceptanceRepository.deleteByTaskId(taskId);
        commentRepository.deleteByTaskId(taskId);
        historyRepository.deleteByTaskId(taskId);
        labelRepository.deleteByTaskId(taskId);
        taskRepository.delete(task);
    }

    // ── Internal Helper Methods ───────────────────────────────────────────────

    private Task resolveTask(UUID roomId, String taskIdOrKey) {
        try {
            UUID id = UUID.fromString(taskIdOrKey);
            Optional<Task> byId = taskRepository.findByIdAndRoomId(id, roomId);
            if (byId.isPresent()) return byId.get();
        } catch (IllegalArgumentException ignored) {}

        return taskRepository.findByRoomIdAndTaskKey(roomId, taskIdOrKey.trim().toUpperCase())
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found: " + taskIdOrKey));
    }

    private String toInternalStatus(String status) {
        if (status == null) return "TODO";
        String s = status.trim().toUpperCase();
        if ("INPROGRESS".equals(s) || "IN_PROGRESS".equals(s)) return "IN_PROGRESS";
        if ("DONE".equals(s)) return "DONE";
        return "TODO";
    }

    private int computeNextPosition(UUID roomId, String status) {
        List<Task> col = taskRepository.findByRoomIdAndStatusOrderByPositionAsc(roomId, status);
        int max = -1;
        for (Task t : col) if (t.getPosition() > max) max = t.getPosition();
        return max + 1;
    }

    private void saveLabels(UUID taskId, List<String> labels) {
        if (labels == null) return;
        for (String lbl : labels) {
            if (lbl != null && !lbl.isBlank()) {
                labelRepository.save(new TaskLabel(taskId, lbl.trim()));
            }
        }
    }

    private void notifyAssigneeIfApplicable(Room room, User user, UUID assigneeId, String taskKey) {
        if (assigneeId != null && !assigneeId.equals(user.getId())) {
            userRepository.findById(assigneeId).ifPresent(assignee ->
                    notificationService.notifyUser(assignee, room, NotificationType.TASK_ASSIGNED,
                            "Task Assigned", "You were assigned to " + taskKey));
        }
    }

    private void notifyBlocked(Room room, User user, Task task) {
        memberRepository.findByRoomIdAndRole(room.getId(), "LEADER").ifPresent(leaderMember -> {
            if (!leaderMember.getUserId().equals(user.getId())) {
                userRepository.findById(leaderMember.getUserId()).ifPresent(leader ->
                        notificationService.notifyUser(leader, room, NotificationType.TASK_BLOCKED,
                                "Task Blocked", task.getTaskKey() + " was flagged: " + task.getBlockedReason()));
            }
        });

        if (task.getAssigneeId() != null && !task.getAssigneeId().equals(user.getId())) {
            userRepository.findById(task.getAssigneeId()).ifPresent(assignee ->
                    notificationService.notifyUser(assignee, room, NotificationType.TASK_BLOCKED,
                            "Task Blocked", task.getTaskKey() + " was flagged: " + task.getBlockedReason()));
        }
    }

    private void parseAndNotifyMentions(Room room, User user, Task task, String text) {
        Matcher m = Pattern.compile("@([A-Za-z0-9_-]+)").matcher(text);
        Set<String> mentionedNames = new HashSet<>();
        while (m.find()) {
            mentionedNames.add(m.group(1).toLowerCase());
        }

        if (mentionedNames.isEmpty()) return;

        List<RoomMember> members = memberRepository.findByRoomId(room.getId());
        Set<UUID> notified = new HashSet<>();
        for (RoomMember rm : members) {
            if (rm.getUserId().equals(user.getId())) continue;
            userRepository.findById(rm.getUserId()).ifPresent(u -> {
                String name = u.getName() != null ? u.getName().trim() : "";
                String firstName = name.split("\\s+")[0].toLowerCase();
                if (mentionedNames.contains(firstName) && !notified.contains(u.getId())) {
                    notified.add(u.getId());
                    notificationService.notifyUser(u, room, NotificationType.MENTION,
                            "Mentioned in " + task.getTaskKey(),
                            user.getName() + " mentioned you: \"" + truncate(text, 80) + "\"");
                }
            });
        }
    }

    private String truncate(String text, int max) {
        if (text == null || text.length() <= max) return text;
        return text.substring(0, max) + "...";
    }

    private void applyFieldUpdatesAndHistory(Task task, UpdateTaskRequest request, User user) {
        if (request.summary() != null && !request.summary().isBlank() && !request.summary().trim().equals(task.getSummary())) {
            historyRepository.save(new TaskHistory(task.getId(), user.getId(), user.getName() + " updated the summary"));
            task.setSummary(request.summary().trim());
        }
        if (request.description() != null && !request.description().equals(task.getDescription())) {
            historyRepository.save(new TaskHistory(task.getId(), user.getId(), user.getName() + " updated the description"));
            task.setDescription(request.description());
        }
        if (request.priority() != null && !request.priority().equalsIgnoreCase(task.getPriority())) {
            historyRepository.save(new TaskHistory(task.getId(), user.getId(),
                    user.getName() + " changed the priority from " + task.getPriority() + " to " + request.priority()));
            task.setPriority(request.priority().toUpperCase());
        }
        if (request.phaseId() != null && !request.phaseId().equals(task.getPhaseId())) {
            historyRepository.save(new TaskHistory(task.getId(), user.getId(), user.getName() + " changed the phase"));
            task.setPhaseId(request.phaseId());
        }
        if (request.role() != null && !request.role().equals(task.getRoleLabel())) {
            historyRepository.save(new TaskHistory(task.getId(), user.getId(), user.getName() + " changed the role to " + request.role()));
            task.setRoleLabel(request.role());
        }
        if (request.estimateMin() != null && request.estimateMin() != task.getEstimateMin()) {
            historyRepository.save(new TaskHistory(task.getId(), user.getId(), user.getName() + " changed the estimate to " + request.estimateMin() + "m"));
            task.setEstimateMin(request.estimateMin());
        }
        if (request.dueAt() != null && !request.dueAt().equals(task.getDueAt())) {
            historyRepository.save(new TaskHistory(task.getId(), user.getId(), user.getName() + " changed the due date"));
            task.setDueAt(request.dueAt());
        }
    }

    private void reorderColumnTasks(UUID roomId, Task task, String targetStatus, String oldStatus, int toIndex) {
        List<Task> targetCol = taskRepository.findByRoomIdAndStatusOrderByPositionAsc(roomId, targetStatus);
        List<Task> cleanTarget = new ArrayList<>();
        for (Task t : targetCol) {
            if (!t.getId().equals(task.getId())) cleanTarget.add(t);
        }

        int clamped = Math.max(0, Math.min(toIndex, cleanTarget.size()));
        cleanTarget.add(clamped, task);

        for (int i = 0; i < cleanTarget.size(); i++) {
            Task item = cleanTarget.get(i);
            item.setPosition(i);
            taskRepository.save(item);
        }

        if (!targetStatus.equals(oldStatus)) {
            List<Task> sourceCol = taskRepository.findByRoomIdAndStatusOrderByPositionAsc(roomId, oldStatus);
            int idx = 0;
            for (Task t : sourceCol) {
                if (!t.getId().equals(task.getId())) {
                    t.setPosition(idx++);
                    taskRepository.save(t);
                }
            }
        }
    }

    private BoardSummaryDto computeBoardSummary(UUID roomId) {
        List<Task> tasks = taskRepository.findByRoomId(roomId);
        Instant now = clock.instant();
        Instant in24h = now.plus(Duration.ofHours(24));
        long total = tasks.size(), open = 0, todo = 0, inProg = 0, done = 0;
        long blocked = 0, unassigned = 0, dueToday = 0;

        for (Task t : tasks) {
            String norm = taskDtoMapper.normalizeStatus(t.getStatus());
            if ("done".equals(norm)) {
                done++;
            } else {
                open++;
                if (t.isFlagged()) blocked++;
                if (t.getAssigneeId() == null) unassigned++;
                if (t.getDueAt() != null && !t.getDueAt().isBefore(now) && !t.getDueAt().isAfter(in24h)) {
                    dueToday++;
                }
            }
            if ("todo".equals(norm)) todo++;
            if ("inprogress".equals(norm)) inProg++;
        }
        return new BoardSummaryDto(total, open, todo, inProg, blocked, done, unassigned, dueToday);
    }

    private TaskDto buildTaskDto(Task task) {
        PlanPhase phase = task.getPhaseId() != null ? phaseRepository.findById(task.getPhaseId()).orElse(null) : null;
        User assignee = task.getAssigneeId() != null ? userRepository.findById(task.getAssigneeId()).orElse(null) : null;
        User reporter = task.getReporterId() != null ? userRepository.findById(task.getReporterId()).orElse(null) : null;
        List<String> labels = labelRepository.findByTaskId(task.getId()).stream().map(TaskLabel::getLabel).toList();
        List<Subtask> subtasks = subtaskRepository.findByTaskIdOrderByPositionAsc(task.getId());
        List<TaskAcceptanceItem> acceptance = acceptanceRepository.findByTaskIdOrderByPositionAsc(task.getId());
        boolean hasBranch = !branchTaskRepository.findByTaskId(task.getId()).isEmpty();

        return taskDtoMapper.toDto(task, phase, assignee, reporter, labels, subtasks, acceptance, Collections.emptyList(), Collections.emptyList(), 0, hasBranch);
    }

    private TaskDetailDto buildTaskDetail(Task task, User viewer) {
        PlanPhase phase = task.getPhaseId() != null ? phaseRepository.findById(task.getPhaseId()).orElse(null) : null;
        User assignee = task.getAssigneeId() != null ? userRepository.findById(task.getAssigneeId()).orElse(null) : null;
        User reporter = task.getReporterId() != null ? userRepository.findById(task.getReporterId()).orElse(null) : null;
        List<String> labels = labelRepository.findByTaskId(task.getId()).stream().map(TaskLabel::getLabel).toList();
        List<Subtask> subtasks = subtaskRepository.findByTaskIdOrderByPositionAsc(task.getId());
        List<TaskAcceptanceItem> acceptance = acceptanceRepository.findByTaskIdOrderByPositionAsc(task.getId());

        List<TaskDependency> deps = dependencyRepository.findByTaskId(task.getId());
        List<TaskDependencyItemDto> dependsOn = new ArrayList<>();
        for (TaskDependency d : deps) {
            taskRepository.findById(d.getDependsOnTaskId()).ifPresent(t ->
                    dependsOn.add(new TaskDependencyItemDto(t.getId(), t.getTaskKey(), t.getSummary(), taskDtoMapper.normalizeStatus(t.getStatus()))));
        }

        List<TaskDependency> blockerDeps = dependencyRepository.findByDependsOnTaskId(task.getId());
        List<TaskDependencyItemDto> blocks = new ArrayList<>();
        for (TaskDependency d : blockerDeps) {
            taskRepository.findById(d.getTaskId()).ifPresent(t ->
                    blocks.add(new TaskDependencyItemDto(t.getId(), t.getTaskKey(), t.getSummary(), taskDtoMapper.normalizeStatus(t.getStatus()))));
        }

        List<TaskComment> comments = commentRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());
        List<TaskCommentDto> commentDtos = new ArrayList<>();
        for (TaskComment c : comments) {
            User author = userRepository.findById(c.getAuthorId()).orElse(null);
            boolean isMine = viewer != null && c.getAuthorId().equals(viewer.getId());
            commentDtos.add(new TaskCommentDto(c.getId(), taskDtoMapper.toUserDto(author), c.getText(), c.getCreatedAt(), c.getEditedAt(), isMine));
        }

        List<TaskHistory> history = historyRepository.findByTaskIdOrderByCreatedAtDesc(task.getId());
        List<TaskHistoryDto> historyDtos = new ArrayList<>();
        for (TaskHistory h : history) {
            User actor = h.getActorId() != null ? userRepository.findById(h.getActorId()).orElse(null) : null;
            historyDtos.add(new TaskHistoryDto(h.getId(), taskDtoMapper.toUserDto(actor), h.getText(), h.getCreatedAt()));
        }

        List<GithubBranchTask> branchTasks = branchTaskRepository.findByTaskId(task.getId());
        List<TaskDevelopmentDto> development = new ArrayList<>();
        for (GithubBranchTask bt : branchTasks) {
            branchRepository.findById(bt.getBranchId()).ifPresent(b ->
                    development.add(new TaskDevelopmentDto(b.getId(), b.getName(), b.getPrStatus(), b.getPrNumber(), b.getUrl())));
        }
        boolean hasBranch = !development.isEmpty();

        return taskDtoMapper.toDetailDto(task, phase, assignee, reporter, labels, subtasks, acceptance, dependsOn, blocks, commentDtos, historyDtos, development, hasBranch);
    }
}
