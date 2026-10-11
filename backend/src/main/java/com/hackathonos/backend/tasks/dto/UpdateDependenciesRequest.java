package com.hackathonos.backend.tasks.dto;

import java.util.List;
import java.util.UUID;

public record UpdateDependenciesRequest(
        List<UUID> dependsOnTaskIds
) {}
