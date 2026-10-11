package com.hackathonos.backend.tasks.dto;

public record MoveTaskResponseDto(
        BoardSummaryDto summary,
        TaskDto task
) {}
