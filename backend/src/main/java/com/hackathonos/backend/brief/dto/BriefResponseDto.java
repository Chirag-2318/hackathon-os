package com.hackathonos.backend.brief.dto;

import java.util.List;
import java.util.Map;

public record BriefResponseDto(
        String roomId,
        String source,
        String sourceUrl,
        String fileName,
        String rawText,
        boolean hasSource,
        BriefFieldsDto fields,
        int rubricTotal,
        boolean confirmed,
        Map<String, Boolean> confirmedFields,
        boolean needsStructuring,
        BriefPermissionsDto permissions,
        List<String> risks
) {}
