package com.hackathonos.backend.apihub;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.apihub.dto.ApiHubDtos.*;
import com.hackathonos.backend.users.User;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
public class ApiHubController {

    private final ApiHubService apiHubService;
    private final CurrentUser currentUser;

    public ApiHubController(ApiHubService apiHubService, CurrentUser currentUser) {
        this.apiHubService = apiHubService;
        this.currentUser = currentUser;
    }

    private User resolveUser(User user) {
        return user != null ? user : currentUser.get();
    }

    // ==========================================
    // Full Hub State & Summary
    // ==========================================

    @GetMapping({"/api/v1/rooms/{roomId}/api-hub", "/rooms/{roomId}/api-hub", "/api/v1/rooms/{roomId}/apis"})
    public ApiHubResponse getApis(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.getApis(roomId, resolveUser(user));
    }

    @GetMapping({"/api/v1/rooms/{roomId}/api-hub/summary", "/rooms/{roomId}/api-hub/summary"})
    public ApiHubSummaryResponse getSummary(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.getSummary(roomId, resolveUser(user));
    }

    // ==========================================
    // External APIs
    // ==========================================

    @GetMapping({"/api/v1/rooms/{roomId}/api-hub/external", "/rooms/{roomId}/api-hub/external"})
    public List<ExternalDto> getExternals(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.getExternals(roomId, resolveUser(user));
    }

    @PostMapping({"/api/v1/rooms/{roomId}/api-hub/external", "/rooms/{roomId}/api-hub/external", "/api/v1/rooms/{roomId}/apis/externals"})
    @ResponseStatus(HttpStatus.CREATED)
    public ExternalDto createExternal(
            @PathVariable UUID roomId,
            @RequestBody CreateExternalRequest request,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.createExternal(roomId, request, resolveUser(user));
    }

    @PatchMapping({"/api/v1/rooms/{roomId}/api-hub/external/{apiId}", "/rooms/{roomId}/api-hub/external/{apiId}", "/api/v1/rooms/{roomId}/apis/externals/{apiId}"})
    public ExternalDto updateExternal(
            @PathVariable UUID roomId,
            @PathVariable UUID apiId,
            @RequestBody UpdateExternalRequest request,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.updateExternal(roomId, apiId, request, resolveUser(user));
    }

    @DeleteMapping({"/api/v1/rooms/{roomId}/api-hub/external/{apiId}", "/rooms/{roomId}/api-hub/external/{apiId}", "/api/v1/rooms/{roomId}/apis/externals/{apiId}"})
    public ResponseEntity<Void> deleteExternal(
            @PathVariable UUID roomId,
            @PathVariable UUID apiId,
            @AuthenticationPrincipal User user
    ) {
        apiHubService.deleteExternal(roomId, apiId, resolveUser(user));
        return ResponseEntity.noContent().build();
    }

    @PostMapping({"/api/v1/rooms/{roomId}/api-hub/external/{apiId}/check", "/rooms/{roomId}/api-hub/external/{apiId}/check", "/api/v1/rooms/{roomId}/apis/externals/{apiId}/check"})
    public ExternalDto checkExternal(
            @PathVariable UUID roomId,
            @PathVariable UUID apiId,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.checkExternal(roomId, apiId, resolveUser(user));
    }

    // ==========================================
    // Our Endpoints
    // ==========================================

    @GetMapping({"/api/v1/rooms/{roomId}/api-hub/endpoints", "/rooms/{roomId}/api-hub/endpoints"})
    public List<EndpointDto> getEndpoints(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.getEndpoints(roomId, resolveUser(user));
    }

    @PostMapping({"/api/v1/rooms/{roomId}/api-hub/endpoints", "/rooms/{roomId}/api-hub/endpoints", "/api/v1/rooms/{roomId}/apis/endpoints"})
    @ResponseStatus(HttpStatus.CREATED)
    public EndpointDto createEndpoint(
            @PathVariable UUID roomId,
            @RequestBody CreateEndpointRequest request,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.createEndpoint(roomId, request, resolveUser(user));
    }

    @PatchMapping({"/api/v1/rooms/{roomId}/api-hub/endpoints/{endpointId}", "/rooms/{roomId}/api-hub/endpoints/{endpointId}", "/api/v1/rooms/{roomId}/apis/endpoints/{endpointId}"})
    public EndpointDto updateEndpoint(
            @PathVariable UUID roomId,
            @PathVariable UUID endpointId,
            @RequestBody UpdateEndpointRequest request,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.updateEndpoint(roomId, endpointId, request, resolveUser(user));
    }

    @PutMapping({"/api/v1/rooms/{roomId}/api-hub/endpoints/{endpointId}", "/rooms/{roomId}/api-hub/endpoints/{endpointId}", "/api/v1/rooms/{roomId}/apis/endpoints/{endpointId}"})
    public EndpointDto updateEndpointPut(
            @PathVariable UUID roomId,
            @PathVariable UUID endpointId,
            @RequestBody UpdateEndpointRequest request,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.updateEndpoint(roomId, endpointId, request, resolveUser(user));
    }

    @DeleteMapping({"/api/v1/rooms/{roomId}/api-hub/endpoints/{endpointId}", "/rooms/{roomId}/api-hub/endpoints/{endpointId}", "/api/v1/rooms/{roomId}/apis/endpoints/{endpointId}"})
    public ResponseEntity<Void> deleteEndpoint(
            @PathVariable UUID roomId,
            @PathVariable UUID endpointId,
            @AuthenticationPrincipal User user
    ) {
        apiHubService.deleteEndpoint(roomId, endpointId, resolveUser(user));
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // OpenAPI Import & Seed from Plan
    // ==========================================

    @PostMapping(value = {"/api/v1/rooms/{roomId}/api-hub/import", "/rooms/{roomId}/api-hub/import", "/api/v1/rooms/{roomId}/apis/import"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportApiResponse importMultipart(
            @PathVariable UUID roomId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text,
            @RequestParam(value = "mode", defaultValue = "MERGE") String mode,
            @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun,
            @AuthenticationPrincipal User user
    ) {
        byte[] bytes = null;
        if (file != null && !file.isEmpty()) {
            try {
                bytes = file.getBytes();
            } catch (Exception ignored) {}
        }
        return apiHubService.importOpenApi(roomId, text, bytes, mode, dryRun, resolveUser(user));
    }

    @PostMapping(value = {"/api/v1/rooms/{roomId}/api-hub/import", "/rooms/{roomId}/api-hub/import", "/api/v1/rooms/{roomId}/apis/import"}, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ImportApiResponse importJson(
            @PathVariable UUID roomId,
            @RequestBody ImportApiRequest body,
            @RequestParam(value = "mode", required = false) String modeParam,
            @RequestParam(value = "dryRun", required = false) Boolean dryRunParam,
            @AuthenticationPrincipal User user
    ) {
        String mode = body.mode() != null ? body.mode() : (modeParam != null ? modeParam : "MERGE");
        boolean dryRun = body.dryRun() != null ? body.dryRun() : (dryRunParam != null ? dryRunParam : false);
        return apiHubService.importOpenApi(roomId, body.text(), null, mode, dryRun, resolveUser(user));
    }

    @PostMapping({"/api/v1/rooms/{roomId}/api-hub/import-from-plan", "/rooms/{roomId}/api-hub/import-from-plan"})
    public ImportFromPlanResponse importFromPlan(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.importFromPlan(roomId, resolveUser(user));
    }

    // ==========================================
    // OpenAPI Export (.json & .yaml)
    // ==========================================

    @GetMapping(value = {"/api/v1/rooms/{roomId}/api-hub/openapi.json", "/rooms/{roomId}/api-hub/openapi.json", "/api/v1/rooms/{roomId}/apis/openapi.json"}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> exportOpenApiJson(
            @PathVariable UUID roomId,
            @RequestParam(value = "download", defaultValue = "false") boolean download,
            @AuthenticationPrincipal User user
    ) {
        String json = apiHubService.exportOpenApi(roomId, resolveUser(user));
        HttpHeaders headers = new HttpHeaders();
        if (download) {
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"openapi.json\"");
        }
        return ResponseEntity.ok().headers(headers).body(json);
    }

    @GetMapping(value = {"/api/v1/rooms/{roomId}/api-hub/openapi.yaml", "/rooms/{roomId}/api-hub/openapi.yaml"}, produces = "application/yaml")
    public ResponseEntity<String> exportOpenApiYaml(
            @PathVariable UUID roomId,
            @RequestParam(value = "download", defaultValue = "false") boolean download,
            @AuthenticationPrincipal User user
    ) {
        String yaml = apiHubService.exportOpenApiYaml(roomId, resolveUser(user));
        HttpHeaders headers = new HttpHeaders();
        if (download) {
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"openapi.yaml\"");
        }
        return ResponseEntity.ok().headers(headers).body(yaml);
    }

    @PutMapping({"/api/v1/rooms/{roomId}/api-hub/mock", "/rooms/{roomId}/api-hub/mock", "/api/v1/rooms/{roomId}/apis/mock"})
    public MockInfoDto toggleMock(
            @PathVariable UUID roomId,
            @RequestBody ToggleMockRequest request,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.toggleMock(roomId, request, resolveUser(user));
    }
}
