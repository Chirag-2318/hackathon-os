package com.hackathonos.backend.apihub;

import com.hackathonos.backend.apihub.dto.ApiHubDtos.*;
import com.hackathonos.backend.users.User;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
public class ApiHubController {

    private final ApiHubService apiHubService;

    public ApiHubController(ApiHubService apiHubService) {
        this.apiHubService = apiHubService;
    }

    @GetMapping("/api/v1/rooms/{roomId}/apis")
    public ApiHubResponse getApis(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.getApis(roomId, user);
    }

    @PostMapping("/api/v1/rooms/{roomId}/apis/externals")
    public ExternalDto createExternal(
            @PathVariable UUID roomId,
            @RequestBody CreateExternalRequest request,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.createExternal(roomId, request, user);
    }

    @PatchMapping("/api/v1/rooms/{roomId}/apis/externals/{id}")
    public ExternalDto updateExternal(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @RequestBody UpdateExternalRequest request,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.updateExternal(roomId, id, request, user);
    }

    @DeleteMapping("/api/v1/rooms/{roomId}/apis/externals/{id}")
    public ResponseEntity<Void> deleteExternal(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        apiHubService.deleteExternal(roomId, id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/rooms/{roomId}/apis/externals/{id}/check")
    public ExternalDto checkExternal(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.checkExternal(roomId, id, user);
    }

    @PostMapping("/api/v1/rooms/{roomId}/apis/endpoints")
    public EndpointDto createEndpoint(
            @PathVariable UUID roomId,
            @RequestBody CreateEndpointRequest request,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.createEndpoint(roomId, request, user);
    }

    @PutMapping("/api/v1/rooms/{roomId}/apis/endpoints/{id}")
    public EndpointDto updateEndpoint(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @RequestBody UpdateEndpointRequest request,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.updateEndpoint(roomId, id, request, user);
    }

    @DeleteMapping("/api/v1/rooms/{roomId}/apis/endpoints/{id}")
    public ResponseEntity<Void> deleteEndpoint(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        apiHubService.deleteEndpoint(roomId, id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/rooms/{roomId}/apis/import")
    public ImportApiResponse importOpenApi(
            @PathVariable UUID roomId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestBody(required = false) ImportApiRequest body,
            @AuthenticationPrincipal User user
    ) {
        String text = body != null ? body.text() : null;
        byte[] bytes = null;
        if (file != null) {
            try {
                bytes = file.getBytes();
            } catch (Exception ignored) {}
        }
        return apiHubService.importOpenApi(roomId, text, bytes, user);
    }

    @GetMapping(value = "/api/v1/rooms/{roomId}/apis/openapi.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public String exportOpenApi(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.exportOpenApi(roomId, user);
    }

    @PutMapping("/api/v1/rooms/{roomId}/apis/mock")
    public MockInfoDto toggleMock(
            @PathVariable UUID roomId,
            @RequestBody ToggleMockRequest request,
            @AuthenticationPrincipal User user
    ) {
        return apiHubService.toggleMock(roomId, request, user);
    }
}
