package com.hackathonos.backend.templates;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.templates.dto.EventTemplateDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class EventTemplateService {

    private final EventTemplateRepository templateRepository;
    private final ObjectMapper objectMapper;

    public EventTemplateService(EventTemplateRepository templateRepository, ObjectMapper objectMapper) {
        this.templateRepository = templateRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Loads an event template by its slug ID or throws NotFoundException.
     * Supports both direct ID and pb-* alias lookups.
     */
    public EventTemplate getOrThrow(String templateId) {
        if (templateId == null || templateId.isBlank()) {
            return templateRepository.findById("sih-36h")
                    .orElseGet(() -> templateRepository.findAll().stream().findFirst()
                            .orElseThrow(() -> new NotFoundException("TEMPLATE_NOT_FOUND", "No event templates available")));
        }

        // Direct lookup first
        java.util.Optional<EventTemplate> direct = templateRepository.findById(templateId);
        if (direct.isPresent()) {
            return direct.get();
        }

        // Alias resolution
        String aliased = switch (templateId.toLowerCase().trim()) {
            case "pb-sih", "sih" -> "sih-36h";
            case "pb-devpost", "devpost" -> "online-48h";
            case "pb-mlh", "mlh" -> "weekend-mlh";
            case "pb-sprint", "sprint" -> "ai-sprint-4h";
            case "pb-corporate" -> "corporate";
            case "pb-solo" -> "solo";
            default -> templateId;
        };

        return templateRepository.findById(aliased)
                .orElseThrow(() -> {
                    List<String> available = templateRepository.findAll().stream().map(EventTemplate::getId).toList();
                    return new NotFoundException("TEMPLATE_NOT_FOUND", "Event template not found: " + templateId + ". Available templates: " + available);
                });
    }

    private List<EventTemplateDto> cachedTemplates;
    private java.time.Instant cacheExpiry = java.time.Instant.MIN;

    /**
     * Returns all event templates ordered by sort_order.
     * Cached in-memory with a 1-hour TTL.
     */
    public synchronized List<EventTemplateDto> listAll() {
        if (cachedTemplates != null && java.time.Instant.now().isBefore(cacheExpiry)) {
            return cachedTemplates;
        }
        List<EventTemplate> templates = templateRepository.findAllByOrderBySortOrderAsc();
        List<EventTemplateDto> dtos = new ArrayList<>();
        java.util.Set<String> seenNames = new java.util.HashSet<>();
        for (EventTemplate template : templates) {
            if (seenNames.add(template.getName())) {
                dtos.add(toDto(template));
            }
        }
        cachedTemplates = dtos;
        cacheExpiry = java.time.Instant.now().plusSeconds(3600);
        return dtos;
    }


    private EventTemplateDto toDto(EventTemplate template) {
        Object parsedPhases;
        try {
            parsedPhases = objectMapper.readValue(template.getPhases(), new TypeReference<>() {});
        } catch (Exception e) {
            parsedPhases = template.getPhases();
        }

        String meta = template.getDurationHours() + "h · " +
                (template.getTeamMin() == template.getTeamMax()
                        ? template.getTeamMax() + " members"
                        : template.getTeamMin() + "–" + template.getTeamMax() + " members");
        String prefills = "Pre-fills: " + template.getDurationHours() + "h clock and phase plan";

        return new EventTemplateDto(
                template.getId(),
                template.getName(),
                template.getDescription(),
                template.getDurationHours(),
                template.getTeamMin(),
                template.getTeamMax(),
                template.getTeamMax(),
                meta,
                prefills,
                template.getIcon(),
                template.getSortOrder(),
                parsedPhases
        );
    }
}
