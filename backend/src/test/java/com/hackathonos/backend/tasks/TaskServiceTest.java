package com.hackathonos.backend.tasks;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.overview.ClockService;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.tasks.dto.MoveTaskRequest;
import com.hackathonos.backend.tasks.dto.UpdateDependenciesRequest;
import com.hackathonos.backend.tasks.dto.UpdateTaskRequest;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock private TaskRepository taskRepository;
    @Mock private SubtaskRepository subtaskRepository;
    @Mock private TaskAcceptanceItemRepository acceptanceRepository;
    @Mock private TaskLabelRepository labelRepository;
    @Mock private TaskDependencyRepository dependencyRepository;
    @Mock private TaskCommentRepository commentRepository;
    @Mock private TaskHistoryRepository historyRepository;
    @Mock private PlanPhaseRepository phaseRepository;
    @Mock private RoomMemberRepository memberRepository;
    @Mock private UserRepository userRepository;
    @Mock private RoomAccess roomAccess;
    @Mock private TaskKeyService taskKeyService;
    @Mock private TaskDtoMapper taskDtoMapper;
    @Mock private DependencyCycleDetector cycleDetector;
    @Mock private ActivityLogger activityLogger;
    @Mock private NotificationService notificationService;
    @Mock private ClockService clockService;
    @Mock private com.hackathonos.backend.github.GithubBranchTaskRepository branchTaskRepository;
    @Mock private com.hackathonos.backend.github.GithubBranchRepository branchRepository;

    private Clock clock;
    private TaskService taskService;

    private final UUID roomId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private User testUser;
    private Room testRoom;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(Instant.parse("2026-10-10T10:00:00Z"), ZoneId.of("UTC"));
        taskService = new TaskService(
                taskRepository, subtaskRepository, acceptanceRepository, labelRepository,
                dependencyRepository, commentRepository, historyRepository, phaseRepository,
                memberRepository, userRepository, roomAccess, taskKeyService,
                taskDtoMapper, cycleDetector, activityLogger, notificationService,
                clockService, clock, branchTaskRepository, branchRepository
        );

        testUser = new User("DEV", "dev@hackathonos.com", "Dev Lead", null, null, null);
        testUser.setId(userId);

        testRoom = new Room();
        testRoom.setId(roomId);
        testRoom.setName("Test Room");
        testRoom.setStage("build");
    }

    @Test
    @DisplayName("Should detect optimistic locking version mismatch and throw TaskConflictException")
    void testOptimisticLockVersionConflict() {
        UUID taskId = UUID.randomUUID();
        Task existing = new Task(roomId, "TR-1", 1, "Task 1", "Desc", "TODO", null, userId, "MEDIUM", null, "Frontend", 60, null, 0, "MANUAL");
        existing.setId(taskId);
        existing.setVersion(2); // Current version in database is 2

        when(roomAccess.getActiveRoomOrThrow(roomId)).thenReturn(testRoom);
        when(taskRepository.findByIdAndRoomId(taskId, roomId)).thenReturn(Optional.of(existing));

        // Client sends update with stale version 1
        UpdateTaskRequest request = new UpdateTaskRequest(
                "Updated summary", null, null, null, null, null, null, null, 1L
        );

        assertThrows(TaskConflictException.class, () -> taskService.updateTask(roomId, testUser, taskId, request));
    }

    @Test
    @DisplayName("Should detect dependency cycle and throw BadRequestException with DEPENDENCY_CYCLE")
    void testDependencyCycleDetection() {
        UUID taskIdA = UUID.randomUUID();
        UUID taskIdB = UUID.randomUUID();

        Task taskA = new Task(roomId, "TR-1", 1, "Task A", null, "TODO", null, userId, "HIGH", null, "Backend", 60, null, 0, "MANUAL");
        taskA.setId(taskIdA);

        Task taskB = new Task(roomId, "TR-2", 2, "Task B", null, "TODO", null, userId, "HIGH", null, "Frontend", 60, null, 1, "MANUAL");
        taskB.setId(taskIdB);

        when(taskRepository.findByIdAndRoomId(taskIdA, roomId)).thenReturn(Optional.of(taskA));
        when(taskRepository.findById(taskIdB)).thenReturn(Optional.of(taskB));
        when(dependencyRepository.findAll()).thenReturn(Collections.emptyList());

        when(cycleDetector.detectCycle(eq(taskIdA), eq(List.of(taskIdB)), any()))
                .thenReturn(new DependencyCycleDetector.CycleCheckResult(true, List.of(taskIdA, taskIdB, taskIdA)));

        UpdateDependenciesRequest req = new UpdateDependenciesRequest(List.of(taskIdB));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                taskService.updateDependencies(roomId, testUser, taskIdA, req)
        );

        assertEquals("DEPENDENCY_CYCLE", ex.getCode());
        assertTrue(ex.getMessage().contains("Dependency cycle detected"));
    }

    @Test
    @DisplayName("Should auto-assign unassigned task on move to IN_PROGRESS and set completedAt on DONE")
    void testMoveTaskAutoAssignAndCompletion() {
        UUID taskId = UUID.randomUUID();
        Task task = new Task(roomId, "TR-1", 1, "Unassigned Task", null, "TODO", null, null, "MEDIUM", null, "Frontend", 60, null, 0, "MANUAL");
        task.setId(taskId);

        when(roomAccess.getActiveRoomOrThrow(roomId)).thenReturn(testRoom);
        when(taskRepository.findByIdAndRoomId(taskId, roomId)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> i.getArgument(0));
        when(taskRepository.findByRoomIdAndStatusOrderByPositionAsc(eq(roomId), any())).thenReturn(List.of(task));
        when(taskRepository.findByRoomId(roomId)).thenReturn(List.of(task));

        // 1. Move to IN_PROGRESS -> should auto-assign to user
        MoveTaskRequest move1 = new MoveTaskRequest("IN_PROGRESS", 0);
        taskService.moveTask(roomId, testUser, taskId, move1);

        assertEquals(userId, task.getAssigneeId(), "Moving unassigned task to IN_PROGRESS must auto-assign to current user");
        assertEquals("IN_PROGRESS", task.getStatus());

        // 2. Move to DONE -> should set completedAt timestamp
        MoveTaskRequest move2 = new MoveTaskRequest("DONE", 0);
        taskService.moveTask(roomId, testUser, taskId, move2);

        assertEquals("DONE", task.getStatus());
        assertNotNull(task.getCompletedAt(), "Moving task to DONE must set completedAt timestamp");
    }
}
