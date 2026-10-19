package com.hackathonos.backend.brief.dto;

import java.util.List;
import java.util.Map;

public record SaveBriefRequest(
        String source,
        String sourceUrl,
        String fileName,
        String rawText,
        BriefFieldsDto fields,
        Map<String, Boolean> confirmedFields,
        List<String> risks,
        Long version
) {
    public SaveBriefRequest(
            String source,
            String sourceUrl,
            String fileName,
            String rawText,
            BriefFieldsDto fields,
            Map<String, Boolean> confirmedFields,
            List<String> risks
    ) {
        this(source, sourceUrl, fileName, rawText, fields, confirmedFields, risks, null);
    }
}
