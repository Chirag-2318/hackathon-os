package com.hackathonos.backend.plan.dto;

import java.util.Collections;
import java.util.List;
import java.util.Map;

public record ValidationDiagnosticsDto(
        String requestId,
        List<FileDiagnosticsDto> files,
        List<String> stepsTaken
) {
    public ValidationDiagnosticsDto {
        if (files == null) files = Collections.emptyList();
        if (stepsTaken == null) stepsTaken = Collections.emptyList();
    }

    public record FileDiagnosticsDto(
            String name,
            long sizeBytes,
            String decodedAs,
            int chars,
            String first80Chars,
            List<String> markersFound,
            List<String> h1s,
            Map<String, List<String>> h2sPerDocument
    ) {
        public FileDiagnosticsDto {
            if (markersFound == null) markersFound = Collections.emptyList();
            if (h1s == null) h1s = Collections.emptyList();
            if (h2sPerDocument == null) h2sPerDocument = Collections.emptyMap();
        }
    }
}
