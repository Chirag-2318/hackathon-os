package com.hackathonos.backend.tasks.dto;

import java.util.List;

public record BoardColumnsDto(
        List<TaskDto> todo,
        List<TaskDto> inprogress,
        List<TaskDto> done
) {}
