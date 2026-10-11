package com.hackathonos.backend.catalog;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Service managing searchable software tools directory and facet aggregations.
 */
@Service
public class ToolService {

    private final ToolRepository toolRepository;

    public ToolService(ToolRepository toolRepository) {
        this.toolRepository = toolRepository;
    }

    /**
     * Searches tools matching category, cost, license, and query filters, computing facet statistics.
     */
    @Transactional(readOnly = true)
    public CatalogDtos.ToolsResponse searchTools(String category, String cost, String license, String q) {
        List<Tool> allTools = toolRepository.findAllByOrderBySortOrderAsc();
        LocalDate now = LocalDate.now();

        // Compute facets from all tools
        Map<String, Long> catCounts = new HashMap<>();
        Map<String, Long> costCounts = new HashMap<>();
        Map<String, Long> licenseCounts = new HashMap<>();

        for (Tool t : allTools) {
            catCounts.put(t.getCategory(), catCounts.getOrDefault(t.getCategory(), 0L) + 1);
            costCounts.put(t.getCost(), costCounts.getOrDefault(t.getCost(), 0L) + 1);
            if (t.getLicense() != null && !t.getLicense().isBlank()) {
                licenseCounts.put(t.getLicense(), licenseCounts.getOrDefault(t.getLicense(), 0L) + 1);
            }
        }

        CatalogDtos.ToolFacetsDto facets = new CatalogDtos.ToolFacetsDto(
                toFacetList(catCounts),
                toFacetList(costCounts),
                toFacetList(licenseCounts)
        );

        // Apply filters
        List<CatalogDtos.ToolItemDto> items = new ArrayList<>();
        String queryLower = q != null ? q.trim().toLowerCase(Locale.ROOT) : "";

        for (Tool t : allTools) {
            if (category != null && !category.isBlank() && !t.getCategory().equalsIgnoreCase(category.trim())) {
                continue;
            }
            if (cost != null && !cost.isBlank() && !t.getCost().equalsIgnoreCase(cost.trim())) {
                continue;
            }
            if (license != null && !license.isBlank() && (t.getLicense() == null || !t.getLicense().equalsIgnoreCase(license.trim()))) {
                continue;
            }
            if (!queryLower.isEmpty()) {
                String nameLower = t.getName().toLowerCase(Locale.ROOT);
                String descLower = t.getDescription() != null ? t.getDescription().toLowerCase(Locale.ROOT) : "";
                if (!nameLower.contains(queryLower) && !descLower.contains(queryLower)) {
                    continue;
                }
            }

            boolean isStale = t.getLastChecked() != null && ChronoUnit.DAYS.between(t.getLastChecked(), now) > 90;

            items.add(new CatalogDtos.ToolItemDto(
                    t.getId(),
                    t.getName(),
                    t.getDescription(),
                    t.getCategory(),
                    t.getCost(),
                    t.getLicense(),
                    t.getUrl(),
                    t.getDescription(),
                    t.getNotes(),
                    t.getLastChecked(),
                    isStale,
                    true
            ));
        }

        return new CatalogDtos.ToolsResponse(items, items, facets);
    }

    private List<CatalogDtos.FacetValueDto> toFacetList(Map<String, Long> map) {
        return map.entrySet().stream()
                .map(e -> new CatalogDtos.FacetValueDto(e.getKey(), e.getValue()))
                .sorted((a, b) -> Long.compare(b.count(), a.count()))
                .toList();
    }
}
