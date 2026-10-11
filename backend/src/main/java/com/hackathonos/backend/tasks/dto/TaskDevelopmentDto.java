package com.hackathonos.backend.tasks.dto;

import java.util.UUID;

public record TaskDevelopmentDto(
        UUID branchId,
        String name,
        String prStatus,
        Integer prNumber,
        String url
) {}
