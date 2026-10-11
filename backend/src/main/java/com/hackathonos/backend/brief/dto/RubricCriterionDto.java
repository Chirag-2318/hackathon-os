package com.hackathonos.backend.brief.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RubricCriterionDto(
        String criterion,
        int weight
) {}
