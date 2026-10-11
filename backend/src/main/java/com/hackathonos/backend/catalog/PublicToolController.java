package com.hackathonos.backend.catalog;

import org.springframework.web.bind.annotation.*;

/**
 * Public controller for searching tools directory and viewing category facets (permitAll).
 */
@RestController
@RequestMapping("/api/v1/tools")
public class PublicToolController {

    private final ToolService toolService;

    public PublicToolController(ToolService toolService) {
        this.toolService = toolService;
    }

    @GetMapping
    public CatalogDtos.ToolsResponse searchTools(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String cost,
            @RequestParam(required = false) String license,
            @RequestParam(required = false) String q
    ) {
        return toolService.searchTools(category, cost, license, q);
    }
}
