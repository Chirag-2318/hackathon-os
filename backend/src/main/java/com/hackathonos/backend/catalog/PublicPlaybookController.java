package com.hackathonos.backend.catalog;

import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public controller for browsing strategy playbooks (permitAll).
 */
@RestController
@RequestMapping("/api/v1/playbooks")
public class PublicPlaybookController {

    private final PlaybookService playbookService;

    public PublicPlaybookController(PlaybookService playbookService) {
        this.playbookService = playbookService;
    }

    @GetMapping
    public List<CatalogDtos.PlaybookCardDto> listPlaybooks() {
        return playbookService.listPlaybooks();
    }

    @GetMapping("/{slug}")
    public CatalogDtos.PlaybookDetailDto getPlaybook(@PathVariable String slug) {
        return playbookService.getPlaybook(slug);
    }
}
