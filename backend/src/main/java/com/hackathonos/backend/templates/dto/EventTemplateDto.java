package com.hackathonos.backend.templates.dto;

public record EventTemplateDto(
        String id,
        String name,
        String description,
        int durationHours,
        int teamMin,
        int teamMax,
        int teamSize,
        String meta,
        String prefills,
        String icon,
        int sortOrder,
        Object phases
) {}
