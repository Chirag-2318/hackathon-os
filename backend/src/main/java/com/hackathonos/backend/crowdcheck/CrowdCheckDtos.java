package com.hackathonos.backend.crowdcheck;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class CrowdCheckDtos {

    public record ClicheDto(
            String label,
            List<String> keywords,
            String hint
    ) {}

    public record CrowdRowDto(
            UUID id,
            UUID ideaId,
            String title,
            String option,
            List<String> competitors,
            String likelyCompetingIdeas,
            int crowdedness,
            String crowdednessLevel, // 'LOW', 'MEDIUM', 'HIGH'
            String notes,
            List<String> clicheMatches
    ) {}

    public record CrowdCheckResponse(
            List<CrowdRowDto> rows,
            List<ClicheDto> cliches,
            Instant serverNow
    ) {}

    public record CreateCrowdRowRequest(
            String title,
            UUID ideaId,
            List<String> competitors,
            Integer crowdedness,
            String notes
    ) {}

    public record UpdateCrowdRowRequest(
            String title,
            List<String> competitors,
            Integer crowdedness,
            String notes
    ) {}
}
