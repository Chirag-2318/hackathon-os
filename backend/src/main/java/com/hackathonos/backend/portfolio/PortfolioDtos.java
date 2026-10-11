package com.hackathonos.backend.portfolio;

import com.hackathonos.backend.retro.RetroDtos;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class PortfolioDtos {

    public record PortfolioSettingsDto(
            boolean isPublic,
            String slug
    ) {}

    public record PortfolioItemDto(
            UUID roomId,
            String name,
            String templateName,
            Instant startedAt,
            Instant endedAt,
            String myRole,
            List<String> mySkills,
            String identity,
            RetroDtos.ProjectLinksDto links,
            String result,
            List<RetroDtos.AwardDto> awards,
            String decision,
            boolean retroDone,
            boolean visible
    ) {}

    public record LessonSummaryDto(
            String tag,
            long count
    ) {}

    public record PortfolioDashboardResponse(
            PortfolioSettingsDto settings,
            List<PortfolioItemDto> items,
            List<LessonSummaryDto> lessons
    ) {}

    public record UpdateSettingsRequest(
            Boolean isPublic,
            String slug
    ) {}

    public record SetVisibilityRequest(
            Boolean visible
    ) {}

    // Public showcase response
    public record PublicItemDto(
            String name,
            String dates,
            String identity,
            RetroDtos.ProjectLinksDto links,
            String result,
            List<RetroDtos.AwardDto> awards
    ) {}

    public record PublicPortfolioResponse(
            String name,
            String avatarUrl,
            List<PublicItemDto> items
    ) {}
}
