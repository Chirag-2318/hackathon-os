package com.hackathonos.backend.catalog;

import com.hackathonos.backend.common.security.CurrentUser;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public controller for searching tools directory and viewing category facets (permitAll),
 * with optional recommended ranking mode for authenticated users.
 */
@RestController
@RequestMapping("/api/v1/tools")
public class PublicToolController {

    private final ToolService toolService;
    private final CurrentUser currentUser;

    public PublicToolController(ToolService toolService, CurrentUser currentUser) {
        this.toolService = toolService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public ResponseEntity<?> searchTools(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String cost,
            @RequestParam(required = false) String license,
            @RequestParam(required = false) String q,
            @RequestParam(required = false, defaultValue = "false") boolean recommended
    ) {
        if (recommended) {
            return ResponseEntity.ok(toolService.getRecommendedTools(currentUser.getOptional().orElse(null)));
        }
        return ResponseEntity.ok(toolService.searchTools(category, cost, license, q));
    }
}
