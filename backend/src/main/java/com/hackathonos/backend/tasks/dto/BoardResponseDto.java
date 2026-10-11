package com.hackathonos.backend.tasks.dto;

import java.time.Instant;
import java.util.List;

public record BoardResponseDto(
        BoardColumnsDto columns,
        List<TaskUserDto> members,
        List<TaskPhaseSummaryDto> phases,
        BoardSummaryDto summary,
        TaskPhaseSummaryDto currentPhase,
        long hoursLeft,
        Instant serverNow
) {}
