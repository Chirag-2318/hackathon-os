package com.hackathonos.backend.tasks;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.common.error.ApiExceptionHandler;
import com.hackathonos.backend.common.error.EntityConflictException;
import com.hackathonos.backend.common.idempotency.IdempotencyService;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.overview.ClockService;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.tasks.dto.TaskDetailDto;
import com.hackathonos.backend.tasks.dto.UpdateTaskRequest;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TaskOptimisticLockTest {

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
    @Mock private com.hackathonos.backend.events.RoomEventService roomEventService;
    @Mock private com.hackathonos.backend.rooms.RoomRepository roomRepository;

    @Mock
    private TaskService taskService;

    @Mock
    private CurrentUser currentUser;

    @Mock
    private IdempotencyService idempotencyService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final UUID roomId = UUID.randomUUID();
    private final UUID taskId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private User user;

    @BeforeEach
    void setUp() {
        user = new User("DEV", "tester@example.com", "Tester", null, null, null);
        user.setId(userId);

        TaskController controller = new TaskController(taskService, currentUser, idempotencyService);
        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("TaskService.updateTask throws TaskConflictException on version mismatch")
    void testTaskServiceVersionConflict() {
        Task task = new Task(roomId, "T-1", 1, "Task 1", null, "TODO", null, userId, "MEDIUM", null, "Backend", 60, null, 0, "MANUAL");
        task.setId(taskId);
        task.setVersion(2L); // current DB version is 2

        Room room = new Room();
        room.setId(roomId);

        when(roomAccess.getActiveRoomOrThrow(roomId)).thenReturn(room);
        when(taskRepository.findByIdAndRoomId(taskId, roomId)).thenReturn(Optional.of(task));

        // Create TaskService directly with required mocks for updateTask
        TaskService service = new TaskService(
                taskRepository, subtaskRepository, acceptanceRepository, labelRepository,
                dependencyRepository, commentRepository, historyRepository, phaseRepository,
                memberRepository, userRepository, roomAccess, taskKeyService,
                taskDtoMapper, cycleDetector, activityLogger, notificationService,
                clockService, java.time.Clock.systemUTC(), branchTaskRepository, branchRepository,
                roomEventService, roomRepository
        );

        // Client passes stale version = 1
        UpdateTaskRequest staleRequest = new UpdateTaskRequest(
                "Updated Summary", null, null, null, null, null, null, null, 1L
        );

        assertThatThrownBy(() -> service.updateTask(roomId, user, taskId, staleRequest))
                .isInstanceOf(TaskConflictException.class);
    }

    @Test
    @DisplayName("PATCH /tasks/{taskId} returns 409 CONFLICT with TASK_CHANGED on optimistic lock conflict")
    void testControllerReturns409OnTaskConflict() throws Exception {
        when(currentUser.get()).thenReturn(user);

        TaskDetailDto currentDetail = org.mockito.Mockito.mock(TaskDetailDto.class);

        when(taskService.updateTask(eq(roomId), eq(user), eq(taskId), any(UpdateTaskRequest.class)))
                .thenThrow(new TaskConflictException(currentDetail));

        UpdateTaskRequest request = new UpdateTaskRequest(
                "Updated title", null, null, null, null, null, null, null, 1L
        );

        mockMvc.perform(patch("/api/v1/rooms/" + roomId + "/tasks/" + taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TASK_CHANGED"))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.requestId").isNotEmpty());
    }
}
