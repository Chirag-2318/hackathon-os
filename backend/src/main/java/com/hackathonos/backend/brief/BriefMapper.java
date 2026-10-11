package com.hackathonos.backend.brief;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.brief.dto.*;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Maps between Brief entity, rubric items, and BriefResponseDto.
 */
@Component
public class BriefMapper {

    private final ObjectMapper objectMapper;

    public BriefMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public BriefResponseDto toDto(Brief brief, List<BriefRubricItem> rubricItems, boolean canEdit, boolean canConfirm) {
        if (brief == null) {
            return null;
        }

        List<RubricCriterionDto> rubricDtos = new ArrayList<>();
        int rubricTotal = 0;
        if (rubricItems != null) {
            for (BriefRubricItem item : rubricItems) {
                rubricDtos.add(new RubricCriterionDto(item.getCriterion(), item.getWeight()));
                rubricTotal += item.getWeight();
            }
        }

        DeadlinesDto deadlinesDto = parseDeadlines(brief.getDeadlines());
        List<String> deliverables = parseStringList(brief.getDeliverables());
        List<String> tracks = parseStringList(brief.getTracksAndPrizes());
        List<String> risks = parseStringList(brief.getRisks());
        Map<String, Boolean> confirmedFields = parseMap(brief.getConfirmedFields());

        BriefFieldsDto fieldsDto = new BriefFieldsDto(
                brief.getProblemStatement(),
                brief.getTargetAudience(),
                rubricDtos,
                deadlinesDto,
                brief.getEligibility(),
                brief.getTechRules(),
                brief.getAiPolicy(),
                deliverables,
                tracks,
                brief.getJudgingFormat(),
                risks
        );

        boolean hasSource = (brief.getSourceUrl() != null && !brief.getSourceUrl().isBlank())
                || (brief.getFileName() != null && !brief.getFileName().isBlank())
                || (brief.getRawText() != null && !brief.getRawText().isBlank());

        boolean anyFieldFilled = (brief.getProblemStatement() != null && !brief.getProblemStatement().isBlank())
                || !rubricDtos.isEmpty()
                || (brief.getTargetAudience() != null && !brief.getTargetAudience().isBlank());
        boolean needsStructuring = hasSource && !anyFieldFilled;

        return new BriefResponseDto(
                brief.getRoomId().toString(),
                brief.getSource(),
                brief.getSourceUrl(),
                brief.getFileName(),
                brief.getRawText(),
                hasSource,
                fieldsDto,
                rubricTotal,
                brief.isConfirmed(),
                confirmedFields,
                needsStructuring,
                new BriefPermissionsDto(canEdit, canConfirm),
                risks
        );
    }

    public DeadlinesDto parseDeadlines(String json) {
        if (json == null || json.isBlank()) {
            return new DeadlinesDto(null, null, null);
        }
        try {
            return objectMapper.readValue(json, DeadlinesDto.class);
        } catch (Exception e) {
            return new DeadlinesDto(null, null, null);
        }
    }

    public List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public Map<String, Boolean> parseMap(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Boolean>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    public String toJson(Object obj) {
        if (obj == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return null;
        }
    }
}
