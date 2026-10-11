package com.hackathonos.backend.speedmode;

import com.hackathonos.backend.tasks.dto.TaskPhaseSummaryDto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class SpeedModeDtos {

    public record SpeedModeClockDto(
            Instant endsAt,
            long hoursLeft,
            long minutesLeft,
            String status,
            TaskPhaseSummaryDto currentPhase
    ) {}

    public record SpeedModeTaskDto(
            UUID id,
            String key,
            String summary,
            String title,
            int estimateMin,
            List<SpeedModeChecklistItemDto> acceptance,
            List<SpeedModeChecklistItemDto> checklist,
            int checklistDone,
            String category
    ) {}

    public record SpeedModeChecklistItemDto(
            UUID id,
            String text,
            String title,
            boolean done,
            boolean isDone
    ) {}

    public record SpeedModeBlockerDto(
            UUID id,
            String key,
            String summary,
            String taskTitle,
            String reason,
            String owner,
            String reportedBy
    ) {}

    public record SpeedModeCaptureDto(
            UUID id,
            String text,
            Instant createdAt
    ) {}

    public record SpeedModeCategoryDto(
            String id,
            String label,
            int count
    ) {}

    public record SpeedModeCheckpointDto(
            String label,
            String endsAt
    ) {}

    public record SpeedModeResponseDto(
            SpeedModeClockDto clock,
            SpeedModeTaskDto currentTask,
            List<SpeedModeTaskDto> queue,
            List<SpeedModeTaskDto> nextUpTasks,
            List<SpeedModeBlockerDto> blockers,
            List<SpeedModeCaptureDto> captures,
            List<SpeedModeCategoryDto> categories,
            String timeToSubmission,
            String timeToCheckpoint,
            SpeedModeCheckpointDto nextCheckpoint,
            Instant serverNow
    ) {}

    public record DoneTaskResponseDto(
            SpeedModeTaskDto next,
            Object summary
    ) {}

    public record CaptureRequest(
            String text
    ) {}
}
