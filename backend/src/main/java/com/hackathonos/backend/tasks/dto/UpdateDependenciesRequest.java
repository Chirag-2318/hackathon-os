package com.hackathonos.backend.tasks.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import java.util.List;
import java.util.UUID;

public record UpdateDependenciesRequest(
        @JsonAlias({"dependsOnIds", "dependsOn"})
        List<UUID> dependsOnTaskIds
) {}
