package com.hackathonos.backend.demo;

import java.time.Instant;
import java.util.UUID;

public class DemoStationDtos {

    public record DemoAssetDto(
            UUID id,
            UUID roomId,
            String kind,
            String url,
            String provider,
            String title,
            String status,
            Instant checkedAt,
            String caption,
            int position,
            UUID addedBy,
            Instant createdAt
    ) {}

    public record CreateLinkAssetRequest(
            String kind,
            String url,
            String title
    ) {}

    public record UpdateAssetRequest(
            String caption,
            Integer position
    ) {}

    public record DemoLadderRungDto(
            String rung,
            String name,
            String status, // READY, MISSING, UNTESTED
            String sayText,
            Instant testedAt,
            UUID testedBy,
            String testedByName
    ) {}

    public record UpdateLadderRungRequest(
            String sayText
    ) {}

    public record DemoPreflightItemDto(
            UUID id,
            String itemHash,
            String label,
            boolean checked,
            UUID checkedBy,
            String checkedByName,
            Instant checkedAt,
            String source,
            int position
    ) {}

    public record CreatePreflightRequest(
            String label
    ) {}

    public record TogglePreflightRequest(
            Boolean checked
    ) {}
}
