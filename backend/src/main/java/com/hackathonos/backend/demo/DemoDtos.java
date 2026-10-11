package com.hackathonos.backend.demo;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class DemoDtos {

    public record DemoSectionDto(
            UUID id,
            int position,
            String title,
            String label,
            int seconds,
            String text
    ) {}

    public record DemoShotDto(
            UUID id,
            int position,
            int shot,
            String title,
            String screen,
            int durationSec,
            int lengthSeconds,
            String notes,
            String narration,
            boolean done
    ) {}

    public record InsuranceItemDto(
            String id,
            String key,
            String label,
            boolean done
    ) {}

    public record DemoMediaDto(
            String videoUrl,
            String fallbackUrl
    ) {}

    public record VideoRulesDto(
            Integer maxSeconds,
            Boolean publicLink,
            Boolean captions
    ) {}

    public record VideoRuleItemDto(
            String field,
            String required,
            String actual,
            String result
    ) {}

    public record DemoToolDto(
            String name,
            String use,
            String category,
            String cost,
            String license,
            String lastChecked,
            boolean verified
    ) {}

    public record DemoResponse(
            List<DemoSectionDto> sections,
            List<DemoSectionDto> beats,
            int totalSeconds,
            int videoMaxSeconds,
            List<DemoShotDto> shots,
            List<InsuranceItemDto> insurance,
            DemoMediaDto media,
            VideoRulesDto videoRules,
            List<VideoRuleItemDto> videoRuleItems,
            List<DemoToolDto> tools,
            Instant serverNow
    ) {}

    public record SectionItemRequest(
            String title,
            int seconds,
            String text
    ) {}

    public record UpdateSectionsRequest(
            List<SectionItemRequest> sections
    ) {}

    public record ShotItemRequest(
            String title,
            int durationSec,
            String notes,
            boolean done
    ) {}

    public record UpdateShotsRequest(
            List<ShotItemRequest> shots
    ) {}

    public record ToggleInsuranceRequest(
            Boolean done
    ) {}

    public record UpdateMediaRequest(
            String videoUrl,
            String fallbackUrl
    ) {}
}
