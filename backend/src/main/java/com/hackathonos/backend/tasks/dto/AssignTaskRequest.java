package com.hackathonos.backend.tasks.dto;

import java.util.UUID;

public record AssignTaskRequest(
        UUID assigneeId
) {}
