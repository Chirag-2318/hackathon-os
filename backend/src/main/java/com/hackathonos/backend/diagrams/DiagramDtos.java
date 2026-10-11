package com.hackathonos.backend.diagrams;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class DiagramDtos {

    public record DiagramItemDto(
            UUID id,
            String title,
            String kind,
            String mermaidSource,
            Instant updatedAt
    ) {}

    public record DiagramTemplateDto(
            String kind,
            String title,
            String mermaidSource
    ) {}

    public record DiagramsResponse(
            List<DiagramItemDto> diagrams,
            List<DiagramTemplateDto> templates
    ) {}

    public record CreateDiagramRequest(
            String title,
            String kind,
            String mermaidSource
    ) {}

    public record UpdateDiagramRequest(
            String title,
            String kind,
            String mermaidSource
    ) {}
}
