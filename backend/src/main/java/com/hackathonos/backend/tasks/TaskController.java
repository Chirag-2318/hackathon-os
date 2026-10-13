package com.hackathonos.backend.tasks;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.tasks.dto.*;
import com.hackathonos.backend.users.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
public class TaskController {

    private final TaskService taskService;
    private final CurrentUser currentUser;
    private final com.hackathonos.backend.common.idempotency.IdempotencyService idempotencyService;

    public TaskController(TaskService taskService, CurrentUser currentUser, com.hackathonos.backend.common.idempotency.IdempotencyService idempotencyService) {
        this.taskService = taskService;
        this.currentUser = currentUser;
        this.idempotencyService = idempotencyService;
    }

    @PostMapping("/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDetailDto createTask(
            @PathVariable UUID roomId,
            @Valid @RequestBody CreateTaskRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        User user = currentUser.get();
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var cached = idempotencyService.get(user.getId(), idempotencyKey);
            if (cached.isPresent() && cached.get() instanceof TaskDetailDto dto) {
                return dto;
            }
        }
        TaskDetailDto result = taskService.createTask(roomId, user, request);
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            idempotencyService.put(user.getId(), idempotencyKey, result);
        }
        return result;
    }


    @GetMapping("/tasks/{taskIdOrKey}")
    public TaskDetailDto getTask(@PathVariable UUID roomId, @PathVariable String taskIdOrKey) {
        return taskService.getTask(roomId, currentUser.get(), taskIdOrKey);
    }

    @PatchMapping("/tasks/{taskId}")
    public TaskDetailDto updateTask(@PathVariable UUID roomId, @PathVariable UUID taskId, @RequestBody UpdateTaskRequest request) {
        return taskService.updateTask(roomId, currentUser.get(), taskId, request);
    }

    @PostMapping("/tasks/{taskId}/move")
    public MoveTaskResponseDto moveTask(@PathVariable UUID roomId, @PathVariable UUID taskId, @Valid @RequestBody MoveTaskRequest request) {
        return taskService.moveTask(roomId, currentUser.get(), taskId, request);
    }

    @PostMapping("/tasks/{taskId}/flag")
    public TaskDetailDto flagTask(@PathVariable UUID roomId, @PathVariable UUID taskId, @RequestBody FlagTaskRequest request) {
        return taskService.flagTask(roomId, currentUser.get(), taskId, request);
    }

    @PostMapping("/tasks/{taskId}/assign")
    public TaskDetailDto assignTask(@PathVariable UUID roomId, @PathVariable UUID taskId, @RequestBody AssignTaskRequest request) {
        return taskService.assignTask(roomId, currentUser.get(), taskId, request);
    }

    @PostMapping("/tasks/{taskId}/subtasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDetailDto addSubtask(@PathVariable UUID roomId, @PathVariable UUID taskId, @Valid @RequestBody CreateSubtaskRequest request) {
        return taskService.addSubtask(roomId, currentUser.get(), taskId, request);
    }

    @PatchMapping("/subtasks/{subtaskId}")
    public TaskDetailDto updateSubtask(@PathVariable UUID roomId, @PathVariable UUID subtaskId, @RequestBody UpdateSubtaskRequest request) {
        return taskService.updateSubtask(roomId, currentUser.get(), subtaskId, request);
    }

    @DeleteMapping("/subtasks/{subtaskId}")
    public TaskDetailDto deleteSubtask(@PathVariable UUID roomId, @PathVariable UUID subtaskId) {
        return taskService.deleteSubtask(roomId, currentUser.get(), subtaskId);
    }

    @PostMapping("/tasks/{taskId}/acceptance")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDetailDto addAcceptance(@PathVariable UUID roomId, @PathVariable UUID taskId, @Valid @RequestBody CreateAcceptanceRequest request) {
        return taskService.addAcceptance(roomId, currentUser.get(), taskId, request);
    }

    @PatchMapping("/acceptance/{itemId}")
    public TaskDetailDto updateAcceptance(@PathVariable UUID roomId, @PathVariable UUID itemId, @RequestBody UpdateAcceptanceRequest request) {
        return taskService.updateAcceptance(roomId, currentUser.get(), itemId, request);
    }

    @DeleteMapping("/acceptance/{itemId}")
    public TaskDetailDto deleteAcceptance(@PathVariable UUID roomId, @PathVariable UUID itemId) {
        return taskService.deleteAcceptance(roomId, currentUser.get(), itemId);
    }

    @PostMapping("/tasks/{taskId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDetailDto addComment(@PathVariable UUID roomId, @PathVariable UUID taskId, @Valid @RequestBody CreateCommentRequest request) {
        return taskService.addComment(roomId, currentUser.get(), taskId, request);
    }

    @PatchMapping("/comments/{commentId}")
    public TaskDetailDto updateComment(@PathVariable UUID roomId, @PathVariable UUID commentId, @Valid @RequestBody UpdateCommentRequest request) {
        return taskService.updateComment(roomId, currentUser.get(), commentId, request);
    }

    @DeleteMapping("/comments/{commentId}")
    public TaskDetailDto deleteComment(@PathVariable UUID roomId, @PathVariable UUID commentId) {
        return taskService.deleteComment(roomId, currentUser.get(), commentId);
    }

    @PutMapping("/tasks/{taskId}/dependencies")
    public TaskDetailDto updateDependencies(@PathVariable UUID roomId, @PathVariable UUID taskId, @RequestBody UpdateDependenciesRequest request) {
        return taskService.updateDependencies(roomId, currentUser.get(), taskId, request);
    }

    @PostMapping("/tasks/{taskId}/confirm")
    public TaskDetailDto confirmTask(@PathVariable UUID roomId, @PathVariable UUID taskId) {
        return taskService.confirmTask(roomId, currentUser.get(), taskId);
    }

    @PostMapping("/tasks/{taskId}/request-changes")
    public TaskDetailDto requestChanges(
            @PathVariable UUID roomId,
            @PathVariable UUID taskId,
            @RequestBody(required = false) RequestChangesRequest request
    ) {
        return taskService.requestChanges(roomId, currentUser.get(), taskId, request);
    }

    @DeleteMapping("/tasks/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable UUID roomId, @PathVariable UUID taskId) {
        taskService.deleteTask(roomId, currentUser.get(), taskId);
    }
}
