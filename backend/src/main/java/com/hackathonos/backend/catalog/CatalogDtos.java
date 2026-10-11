package com.hackathonos.backend.catalog;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class CatalogDtos {

    public record PlaybookCardDto(
            String id,
            String slug,
            String title,
            String summary,
            String category,
            String eventType,
            Integer teamSize,
            int readMinutes
    ) {}

    public record PlaybooksResponse(
            List<PlaybookCardDto> items
    ) {}

    public record PlaybookDetailDto(
            String slug,
            String title,
            String summary,
            String content,
            String category,
            int readMinutes,
            List<PlaybookCardDto> related
    ) {}

    public record ToolItemDto(
            UUID id,
            String name,
            String oneLineUse,
            String category,
            String cost,
            String license,
            String url,
            String description,
            String notes,
            LocalDate lastChecked,
            boolean stale,
            boolean verified
    ) {}

    public record FacetValueDto(
            String value,
            long count
    ) {}

    public record ToolFacetsDto(
            List<FacetValueDto> categories,
            List<FacetValueDto> costs,
            List<FacetValueDto> licenses
    ) {}

    public record ToolsResponse(
            List<ToolItemDto> items,
            List<ToolItemDto> tools,
            ToolFacetsDto facets
    ) {}
}
