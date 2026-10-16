package com.hackathonos.backend.apihub.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ApiHubDtos {

    public record ExternalKeyOwnerDto(UUID id, String name, String avatarUrl) {}

    public record ExternalDto(
            UUID id,
            UUID roomId,
            String name,
            String baseUrl,
            String authType,
            String keyLocation,
            String rateLimit,
            String cost,
            UUID ownerUserId,
            ExternalKeyOwnerDto keyOwner,
            String status,
            String fallback,
            String fallbackNotes,
            String docsUrl,
            String notes,
            UUID createdBy,
            Long version,
            Instant lastCheckedAt,
            Integer latencyMs
    ) {}

    public record CreateExternalRequest(
            String name,
            String baseUrl,
            String authType,
            String keyLocation,
            String rateLimit,
            String cost,
            UUID ownerUserId,
            UUID keyOwnerId, // alias
            String status,
            String fallback,
            String fallbackNotes,
            String docsUrl,
            String notes
    ) {}

    public record UpdateExternalRequest(
            String name,
            String baseUrl,
            String authType,
            String keyLocation,
            String rateLimit,
            String cost,
            UUID ownerUserId,
            UUID keyOwnerId,
            String status,
            String fallback,
            String fallbackNotes,
            String docsUrl,
            String notes,
            Long version
    ) {}

    public record EndpointDto(
            UUID id,
            UUID roomId,
            String method,
            String path,
            String summary,
            String description,
            String tag,
            String requestSchema,
            String responseSchemas,
            String parameters,
            String mockResponse,
            int mockStatus,
            boolean authRequired,
            String source,
            Long version,
            UUID createdBy,
            int position,
            boolean mockEnabled,
            // Backwards compat
            String requestExample,
            int responseStatus,
            String responseExample
    ) {}

    public record CreateEndpointRequest(
            String method,
            String path,
            String summary,
            String description,
            String tag,
            String requestSchema,
            String responseSchemas,
            String parameters,
            String mockResponse,
            Integer mockStatus,
            Boolean authRequired,
            String source,
            Boolean mockEnabled,
            // Backwards compat
            String requestExample,
            Integer responseStatus,
            String responseExample
    ) {}

    public record UpdateEndpointRequest(
            String method,
            String path,
            String summary,
            String description,
            String tag,
            String requestSchema,
            String responseSchemas,
            String parameters,
            String mockResponse,
            Integer mockStatus,
            Boolean authRequired,
            String source,
            Boolean mockEnabled,
            Long version,
            // Backwards compat
            String requestExample,
            Integer responseStatus,
            String responseExample
    ) {}

    public record MockInfoDto(boolean enabled, String url) {}

    public record ToggleMockRequest(Boolean enabled) {}

    public record ApiHubSummaryResponse(
            int mocked,
            int cached,
            int none,
            int totalExternals,
            int totalEndpoints
    ) {}

    public record ImportApiRequest(
            String text,
            String mode, // MERGE or REPLACE
            Boolean dryRun
    ) {}

    public record ImportApiResponse(
            int endpointsFound,
            List<String> tags,
            List<String> servers,
            List<String> warnings,
            int created,
            int updated,
            int skipped
    ) {}

    public record ImportFromPlanResponse(
            int imported,
            int skipped,
            List<String> warnings
    ) {}

    public record ApiHubResponse(
            List<ExternalDto> externals,
            List<EndpointDto> endpoints,
            MockInfoDto mock,
            ApiHubSummaryResponse summary,
            List<String> warnings,
            Instant serverNow
    ) {}
}
