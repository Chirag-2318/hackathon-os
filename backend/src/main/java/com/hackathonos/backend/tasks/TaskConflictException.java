package com.hackathonos.backend.tasks;

import com.hackathonos.backend.tasks.dto.TaskDetailDto;

public class TaskConflictException extends RuntimeException {
    private final TaskDetailDto task;

    public TaskConflictException(TaskDetailDto task) {
        super("Task was modified by another user");
        this.task = task;
    }

    public TaskDetailDto getTask() {
        return task;
    }
}
