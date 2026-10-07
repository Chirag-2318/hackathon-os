package com.hackathonos.backend.room;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Provides static event template options used by the Create Room wizard.
 * These are intentionally hardcoded — they don't need to be stored in the DB
 * since the set is small and product-defined.
 */
@RestController
@RequestMapping("/api/v1/event-templates")
public class EventTemplateController {

    record EventTemplate(String id, String name, String description) {}

    private static final List<EventTemplate> TEMPLATES = List.of(
            new EventTemplate("hackathon",    "Hackathon",     "Time-boxed competitive coding event"),
            new EventTemplate("internal",     "Internal Hack", "Company-internal hackathon or sprint"),
            new EventTemplate("game-jam",     "Game Jam",      "Game development competition"),
            new EventTemplate("designathon",  "Designathon",   "Design-focused sprint"),
            new EventTemplate("buildathon",   "Buildathon",    "Build and ship a product quickly"),
            new EventTemplate("open-source",  "Open Source",   "Open source contribution sprint")
    );

    @GetMapping
    public List<EventTemplate> list() {
        return TEMPLATES;
    }
}
