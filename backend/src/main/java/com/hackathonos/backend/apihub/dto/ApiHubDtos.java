package com.hackathonos.backend.apihub.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ApiHubDtos {

    public record ExternalKeyOwnerDto(UUID id, String name, String avatarUrl) {}

    public record ExternalDto(
            UUID id,
            String name,
            String baseUrl,
            String authType,
            String rateLimit,
            String cost,
            ExternalKeyOwnerDto keyOwner,
            String keyLocation,
            String status,
            String fallback,
            Instant lastCheckedAt,
            Integer latencyMs
    ) {}

    public record CreateExternalRequest(
            String name,
            String baseUrl,
            String authType,
            String rateLimit,
            String cost,
            UUID keyOwnerId,
            String keyLocation,
            String fallback
    ) {}

    public record UpdateExternalRequest(
            String name,
            String baseUrl,
            String authType,
            String rateLimit,
            String cost,
            UUID keyOwnerId,
            String keyLocation,
            String fallback
    ) {}

    public record EndpointDto(
            UUID id,
            String method,
            String path,
            String summary,
            String requestExample,
            int responseStatus,
            String responseExample,
            boolean mockEnabled,
            int position
    ) {}

    public record CreateEndpointRequest(
            String method,
            String path,
            String summary,
            String requestExample,
            Integer responseStatus,
            String responseExample,
            Boolean mockEnabled
    ) {}

    public record UpdateEndpointRequest(
            String method,
            String path,
            String summary,
            String requestExample,
            Integer responseStatus,
            String responseExample,
            Boolean mockEnabled
    ) {}

    public record MockInfoDto(boolean enabled, String url) {}

    public record ToggleMockRequest(Boolean enabled) {}

    public record ApiHubResponse(
            List<ExternalDto> externals,
            List<EndpointDto> endpoints,
            MockInfoDto mock,
            List<String> warnings,
            Instant serverNow
    ) {}

    public record ImportApiRequest(String text) {}

    public record ImportApiResponse(int imported, int skipped, List<String> errors) {}
}
