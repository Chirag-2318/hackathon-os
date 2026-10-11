package com.hackathonos.backend.templates;

import com.hackathonos.backend.templates.dto.EventTemplateDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/event-templates")
public class EventTemplateController {

    private final EventTemplateService templateService;

    public EventTemplateController(EventTemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public List<EventTemplateDto> listTemplates() {
        return templateService.listAll();
    }
}
