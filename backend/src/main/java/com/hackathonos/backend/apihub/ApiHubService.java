package com.hackathonos.backend.apihub;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.*;
import com.hackathonos.backend.common.http.SafeHttpClient;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.apihub.dto.ApiHubDtos.*;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class ApiHubService {

    private static final Pattern SECRET_PATTERN = Pattern.compile(
            "^(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|AKIA[0-9A-Z]{16}|xox[bap]-[A-Za-z0-9-]{10,}|[A-Za-z0-9]{32,})$"
    );

    private static final Set<String> ALLOWED_METHODS = Set.of("GET", "POST", "PUT", "PATCH", "DELETE");

    private final ApiExternalRepository externalRepository;
    private final ApiEndpointRepository endpointRepository;
    private final ApiMockSettingsRepository mockSettingsRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;
    private final SafeHttpClient safeHttpClient;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final YAMLMapper yamlMapper = new YAMLMapper();
    private final Clock clock;

    // Rate limiter: 120 req / min per token
    private final ConcurrentHashMap<String, RateLimitTracker> mockRateLimits = new ConcurrentHashMap<>();

    public ApiHubService(ApiExternalRepository externalRepository,
                         ApiEndpointRepository endpointRepository,
                         ApiMockSettingsRepository mockSettingsRepository,
                         UserRepository userRepository,
                         RoomAccess roomAccess,
                         SafeHttpClient safeHttpClient,
                         AppProperties appProperties,
                         ObjectMapper objectMapper,
                         Clock clock) {
        this.externalRepository = externalRepository;
        this.endpointRepository = endpointRepository;
        this.mockSettingsRepository = mockSettingsRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
        this.safeHttpClient = safeHttpClient;
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    /**
     * Returns all registered external APIs, endpoints, mock settings, and reliability warnings for the room.
     */
    @Transactional(readOnly = true)
    public ApiHubResponse getApis(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        List<ApiExternal> externals = externalRepository.findByRoomIdOrderByLastCheckedAtDesc(roomId);
        List<ApiEndpoint> endpoints = endpointRepository.findByRoomIdOrderByPositionAsc(roomId);
        Optional<ApiMockSettings> mockOpt = mockSettingsRepository.findById(roomId);

        List<ExternalDto> externalDtos = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        for (ApiExternal e : externals) {
            ExternalKeyOwnerDto ownerDto = null;
            if (e.getKeyOwnerId() != null) {
                ownerDto = userRepository.findById(e.getKeyOwnerId())
                        .map(u -> new ExternalKeyOwnerDto(u.getId(), u.getName(), u.getAvatarUrl()))
                        .orElse(null);
            }
            externalDtos.add(new ExternalDto(
                    e.getId(), e.getName(), e.getBaseUrl(), e.getAuthType(),
                    e.getRateLimit(), e.getCost(), ownerDto, e.getKeyLocation(),
                    e.getStatus(), e.getFallback(), e.getLastCheckedAt(), e.getLastLatencyMs()
            ));

            if (e.getFallback() == null || e.getFallback().isBlank()) {
                warnings.add("External API '" + e.getName() + "' has no fallback strategy configured.");
            }
            if ("FAILING".equalsIgnoreCase(e.getStatus())) {
                warnings.add("External API '" + e.getName() + "' failed its latest health check.");
            }
        }

        List<EndpointDto> endpointDtos = new ArrayList<>();
        Set<String> seenMethodPath = new HashSet<>();
        for (ApiEndpoint ep : endpoints) {
            endpointDtos.add(new EndpointDto(
                    ep.getId(), ep.getMethod(), ep.getPath(), ep.getSummary(),
                    ep.getRequestExample(), ep.getResponseStatus(), ep.getResponseExample(),
                    ep.isMockEnabled(), ep.getPosition()
            ));

            if (ep.getResponseExample() == null || ep.getResponseExample().isBlank()) {
                warnings.add("Endpoint " + ep.getMethod() + " " + ep.getPath() + " has no response example.");
            }

            String key = ep.getMethod() + " " + ep.getPath();
            if (!seenMethodPath.add(key)) {
                warnings.add("Duplicate endpoint definition: " + key);
            }
        }

        MockInfoDto mockInfo = mockOpt.map(m -> new MockInfoDto(
                m.isEnabled(), appProperties.getBaseUrl() + "/mock/" + m.getToken() + "/"
        )).orElse(new MockInfoDto(false, null));

        return new ApiHubResponse(externalDtos, endpointDtos, mockInfo, warnings, clock.instant());
    }

    /**
     * Registers a new external API dependency. Validates base URL and guards against leaked secrets in key location.
     */
    @Transactional
    public ExternalDto createExternal(UUID roomId, CreateExternalRequest request, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        validateUrl(request.baseUrl());
        validateKeyLocation(request.keyLocation());

        ApiExternal ext = new ApiExternal(
                roomId, request.name().trim(), request.baseUrl().trim(),
                request.authType() != null ? request.authType().toUpperCase() : "NONE",
                request.rateLimit(), request.cost(), request.keyOwnerId(),
                request.keyLocation(), "UNKNOWN", request.fallback(), null, null
        );
        ApiExternal saved = externalRepository.save(ext);
        return mapExternal(saved);
    }

    /**
     * Updates an existing external API dependency.
     */
    @Transactional
    public ExternalDto updateExternal(UUID roomId, UUID id, UpdateExternalRequest request, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        ApiExternal ext = externalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("EXTERNAL_NOT_FOUND", "External API not found"));

        if (!ext.getRoomId().equals(roomId)) {
            throw new ForbiddenException("FORBIDDEN", "API belongs to another room");
        }

        if (request.baseUrl() != null) {
            validateUrl(request.baseUrl());
            ext.setBaseUrl(request.baseUrl().trim());
        }
        if (request.keyLocation() != null) {
            validateKeyLocation(request.keyLocation());
            ext.setKeyLocation(request.keyLocation().trim());
        }
        if (request.name() != null) ext.setName(request.name().trim());
        if (request.authType() != null) ext.setAuthType(request.authType().toUpperCase());
        if (request.rateLimit() != null) ext.setRateLimit(request.rateLimit());
        if (request.cost() != null) ext.setCost(request.cost());
        if (request.keyOwnerId() != null) ext.setKeyOwnerId(request.keyOwnerId());
        if (request.fallback() != null) ext.setFallback(request.fallback());

        ApiExternal saved = externalRepository.save(ext);
        return mapExternal(saved);
    }

    /**
     * Deletes an external API dependency. Leader only.
     */
    @Transactional
    public void deleteExternal(UUID roomId, UUID id, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireLeader(roomId, user);

        ApiExternal ext = externalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("EXTERNAL_NOT_FOUND", "External API not found"));

        if (!ext.getRoomId().equals(roomId)) {
            throw new ForbiddenException("FORBIDDEN", "API belongs to another room");
        }

        externalRepository.delete(ext);
    }

    /**
     * Performs an SSRF-safe GET health check with a 5-second timeout on the external API.
     */
    @Transactional
    public ExternalDto checkExternal(UUID roomId, UUID id, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        ApiExternal ext = externalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("EXTERNAL_NOT_FOUND", "External API not found"));

        SafeHttpClient.SafeHttpResponse res = safeHttpClient.get(ext.getBaseUrl(), 5000);
        boolean working = res.ok() || (res.httpStatus() > 0 && res.httpStatus() < 500);

        ext.setStatus(working ? "WORKING" : "FAILING");
        ext.setLastCheckedAt(clock.instant());
        ext.setLastLatencyMs((int) res.latencyMs());

        ApiExternal saved = externalRepository.save(ext);
        return mapExternal(saved);
    }

    /**
     * Registers a new project endpoint with example response and mock setting.
     */
    @Transactional
    public EndpointDto createEndpoint(UUID roomId, CreateEndpointRequest request, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        validateMethod(request.method());
        validatePath(request.path());
        validateResponseExample(request.responseExample());

        int nextPos = endpointRepository.findByRoomIdOrderByPositionAsc(roomId).size();
        ApiEndpoint ep = new ApiEndpoint(
                roomId, request.method().toUpperCase(), request.path().trim(),
                request.summary(), request.requestExample(),
                request.responseStatus() != null ? request.responseStatus() : 200,
                request.responseExample(), Boolean.TRUE.equals(request.mockEnabled()),
                nextPos
        );
        ApiEndpoint saved = endpointRepository.save(ep);
        return mapEndpoint(saved);
    }

    /**
     * Updates an existing project endpoint.
     */
    @Transactional
    public EndpointDto updateEndpoint(UUID roomId, UUID id, UpdateEndpointRequest request, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        ApiEndpoint ep = endpointRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("ENDPOINT_NOT_FOUND", "Endpoint not found"));

        if (!ep.getRoomId().equals(roomId)) {
            throw new ForbiddenException("FORBIDDEN", "Endpoint belongs to another room");
        }

        if (request.method() != null) {
            validateMethod(request.method());
            ep.setMethod(request.method().toUpperCase());
        }
        if (request.path() != null) {
            validatePath(request.path());
            ep.setPath(request.path().trim());
        }
        if (request.responseExample() != null) {
            validateResponseExample(request.responseExample());
            ep.setResponseExample(request.responseExample());
        }
        if (request.summary() != null) ep.setSummary(request.summary());
        if (request.requestExample() != null) ep.setRequestExample(request.requestExample());
        if (request.responseStatus() != null) ep.setResponseStatus(request.responseStatus());
        if (request.mockEnabled() != null) ep.setMockEnabled(request.mockEnabled());

        ApiEndpoint saved = endpointRepository.save(ep);
        return mapEndpoint(saved);
    }

    /**
     * Deletes a project endpoint.
     */
    @Transactional
    public void deleteEndpoint(UUID roomId, UUID id, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        ApiEndpoint ep = endpointRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("ENDPOINT_NOT_FOUND", "Endpoint not found"));

        if (!ep.getRoomId().equals(roomId)) {
            throw new ForbiddenException("FORBIDDEN", "Endpoint belongs to another room");
        }

        endpointRepository.delete(ep);
    }

    /**
     * Imports endpoints from an OpenAPI 3.0 or Swagger 2.0 JSON or YAML document.
     */
    @Transactional
    public ImportApiResponse importOpenApi(UUID roomId, String text, byte[] fileBytes, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        String rawContent = (text != null && !text.isBlank()) ? text :
                (fileBytes != null ? new String(fileBytes, java.nio.charset.StandardCharsets.UTF_8) : "");

        if (rawContent.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 1024 * 1024) {
            throw new PayloadTooLargeException("PAYLOAD_TOO_LARGE", "Specification file exceeds 1 MB limit");
        }

        JsonNode root;
        try {
            if (rawContent.trim().startsWith("{")) {
                root = objectMapper.readTree(rawContent);
            } else {
                root = yamlMapper.readTree(rawContent);
            }
        } catch (Exception e) {
            throw new BadRequestException("INVALID_SPEC", "Failed to parse specification as JSON or YAML: " + e.getMessage());
        }

        JsonNode paths = root.path("paths");
        if (!paths.isObject()) {
            throw new BadRequestException("INVALID_SPEC", "OpenAPI document does not contain a valid 'paths' object");
        }

        int imported = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();
        int currentPos = endpointRepository.findByRoomIdOrderByPositionAsc(roomId).size();

        Iterator<String> pathNames = paths.fieldNames();
        while (pathNames.hasNext()) {
            String path = pathNames.next();
            JsonNode pathItem = paths.get(path);
            if (!pathItem.isObject()) continue;

            Iterator<String> methods = pathItem.fieldNames();
            while (methods.hasNext()) {
                String method = methods.next().toUpperCase();
                if (!ALLOWED_METHODS.contains(method)) continue;

                if (endpointRepository.findByRoomIdAndMethodAndPath(roomId, method, path).isPresent()) {
                    skipped++;
                    continue;
                }

                JsonNode op = pathItem.get(methods.next() != null ? method.toLowerCase() : "");
                String summary = op != null ? op.path("summary").asText(null) : null;

                // Find example response
                String responseExample = "{}";
                int status = 200;
                JsonNode responses = op != null ? op.path("responses") : null;
                if (responses != null && responses.isObject()) {
                    JsonNode okResp = responses.path("200").isMissingNode() ? responses.path("201") : responses.path("200");
                    if (!okResp.isMissingNode()) {
                        JsonNode exampleNode = okResp.path("content").path("application/json").path("example");
                        if (exampleNode.isMissingNode()) {
                            exampleNode = okResp.path("examples").path("application/json");
                        }
                        if (!exampleNode.isMissingNode()) {
                            responseExample = exampleNode.toString();
                        }
                    }
                }

                try {
                    ApiEndpoint ep = new ApiEndpoint(
                            roomId, method, path, summary, null, status, responseExample, false, currentPos++
                    );
                    endpointRepository.save(ep);
                    imported++;
                } catch (Exception ex) {
                    errors.add("Failed to import " + method + " " + path + ": " + ex.getMessage());
                }
            }
        }

        return new ImportApiResponse(imported, skipped, errors);
    }

    /**
     * Exports a minimal OpenAPI 3.0 JSON specification generated from registered endpoints.
     */
    @Transactional(readOnly = true)
    public String exportOpenApi(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        List<ApiEndpoint> endpoints = endpointRepository.findByRoomIdOrderByPositionAsc(roomId);
        Map<String, Object> doc = new LinkedHashMap<>();
        doc.put("openapi", "3.0.3");

        Map<String, Object> info = new LinkedHashMap<>();
        info.put("title", room.getName() + " API");
        info.put("version", "1.0.0");
        doc.put("info", info);

        Map<String, Object> paths = new LinkedHashMap<>();
        for (ApiEndpoint ep : endpoints) {
            Map<String, Object> pathItem = (Map<String, Object>) paths.computeIfAbsent(ep.getPath(), k -> new LinkedHashMap<>());
            Map<String, Object> op = new LinkedHashMap<>();
            if (ep.getSummary() != null) op.put("summary", ep.getSummary());

            Map<String, Object> responses = new LinkedHashMap<>();
            Map<String, Object> okResp = new LinkedHashMap<>();
            okResp.put("description", "Successful response");

            if (ep.getResponseExample() != null && !ep.getResponseExample().isBlank()) {
                Map<String, Object> content = new LinkedHashMap<>();
                Map<String, Object> appJson = new LinkedHashMap<>();
                try {
                    JsonNode exJson = objectMapper.readTree(ep.getResponseExample());
                    appJson.put("example", exJson);
                } catch (Exception e) {
                    appJson.put("example", ep.getResponseExample());
                }
                content.put("application/json", appJson);
                okResp.put("content", content);
            }
            responses.put(String.valueOf(ep.getResponseStatus()), okResp);
            op.put("responses", responses);
            pathItem.put(ep.getMethod().toLowerCase(), op);
        }
        doc.put("paths", paths);

        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(doc);
        } catch (Exception e) {
            return "{}";
        }
    }

    /**
     * Enables or disables public mock server for the room, generating a unique token on first enable.
     */
    @Transactional
    public MockInfoDto toggleMock(UUID roomId, ToggleMockRequest request, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        boolean enabled = Boolean.TRUE.equals(request.enabled());
        ApiMockSettings settings = mockSettingsRepository.findById(roomId).orElseGet(() -> {
            String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
            return new ApiMockSettings(roomId, false, token, clock.instant());
        });

        settings.setEnabled(enabled);
        settings.setUpdatedAt(clock.instant());
        ApiMockSettings saved = mockSettingsRepository.save(settings);

        String url = appProperties.getBaseUrl() + "/mock/" + saved.getToken() + "/";
        return new MockInfoDto(saved.isEnabled(), url);
    }

    public record MockResponse(int status, String body) {}

    /**
     * Public mock server handler that matches incoming method and path (including path parameters) and returns configured response.
     */
    @Transactional(readOnly = true)
    public MockResponse serveMock(String token, String method, String requestPath) {
        checkMockRateLimit(token);

        ApiMockSettings settings = mockSettingsRepository.findByToken(token)
                .orElseThrow(() -> new NotFoundException("MOCK_NOT_FOUND", "Mock server token not found"));

        if (!settings.isEnabled()) {
            throw new NotFoundException("MOCK_DISABLED", "Mock server is currently disabled");
        }

        List<ApiEndpoint> enabledEndpoints = endpointRepository.findByRoomIdAndMockEnabledTrue(settings.getRoomId());
        String cleanPath = requestPath.startsWith("/") ? requestPath : "/" + requestPath;

        // Try exact match first
        for (ApiEndpoint ep : enabledEndpoints) {
            if (ep.getMethod().equalsIgnoreCase(method) && ep.getPath().equals(cleanPath)) {
                return new MockResponse(ep.getResponseStatus(), ep.getResponseExample() != null ? ep.getResponseExample() : "{}");
            }
        }

        // Try parameterized pattern match (e.g., /users/{id} matches /users/123)
        for (ApiEndpoint ep : enabledEndpoints) {
            if (ep.getMethod().equalsIgnoreCase(method) && matchesPattern(ep.getPath(), cleanPath)) {
                return new MockResponse(ep.getResponseStatus(), ep.getResponseExample() != null ? ep.getResponseExample() : "{}");
            }
        }

        throw new NotFoundException("NO_MOCK_MATCH", "No mock endpoint matched " + method + " " + cleanPath);
    }

    private boolean matchesPattern(String registeredPath, String requestPath) {
        String[] regParts = registeredPath.split("/");
        String[] reqParts = requestPath.split("/");
        if (regParts.length != reqParts.length) return false;

        for (int i = 0; i < regParts.length; i++) {
            String rp = regParts[i];
            String qp = reqParts[i];
            if (rp.startsWith("{") && rp.endsWith("}")) {
                continue; // Matches any value
            }
            if (!rp.equalsIgnoreCase(qp)) {
                return false;
            }
        }
        return true;
    }

    private void checkMockRateLimit(String token) {
        long nowMs = System.currentTimeMillis();
        RateLimitTracker tracker = mockRateLimits.compute(token, (k, v) -> {
            if (v == null || nowMs - v.windowStart > 60_000) {
                return new RateLimitTracker(nowMs, 1);
            }
            v.count++;
            return v;
        });

        if (tracker.count > 120) {
            throw new TooManyRequestsException("RATE_LIMIT_EXCEEDED", "Mock server rate limit exceeded (120 req/min)");
        }
    }

    private void validateUrl(String url) {
        if (url == null || (!url.startsWith("http://") && !url.startsWith("https://"))) {
            throw new BadRequestException("INVALID_URL", "Base URL must start with http:// or https://");
        }
    }

    private void validateKeyLocation(String keyLocation) {
        if (keyLocation != null && !keyLocation.isBlank()) {
            String trimmed = keyLocation.trim();
            if (SECRET_PATTERN.matcher(trimmed).matches()) {
                throw new BadRequestException("KEY_LOOKS_LIKE_SECRET", "Write where the key lives (for example '.env on the server'), never the key itself");
            }
        }
    }

    private void validateMethod(String method) {
        if (method == null || !ALLOWED_METHODS.contains(method.toUpperCase())) {
            throw new BadRequestException("INVALID_METHOD", "HTTP method must be one of: " + ALLOWED_METHODS);
        }
    }

    private void validatePath(String path) {
        if (path == null || !path.startsWith("/")) {
            throw new BadRequestException("INVALID_PATH", "Path must begin with a forward slash ('/')");
        }
    }

    private void validateResponseExample(String example) {
        if (example != null) {
            String trimmed = example.trim();
            if (trimmed.length() > 20 * 1024) {
                throw new BadRequestException("PAYLOAD_TOO_LARGE", "Response example exceeds maximum 20 KB size");
            }
            if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                try {
                    objectMapper.readTree(trimmed);
                } catch (Exception e) {
                    throw new BadRequestException("INVALID_JSON", "Response example is not valid JSON: " + e.getMessage());
                }
            }
        }
    }

    private ExternalDto mapExternal(ApiExternal e) {
        ExternalKeyOwnerDto ownerDto = null;
        if (e.getKeyOwnerId() != null) {
            ownerDto = userRepository.findById(e.getKeyOwnerId())
                    .map(u -> new ExternalKeyOwnerDto(u.getId(), u.getName(), u.getAvatarUrl()))
                    .orElse(null);
        }
        return new ExternalDto(
                e.getId(), e.getName(), e.getBaseUrl(), e.getAuthType(),
                e.getRateLimit(), e.getCost(), ownerDto, e.getKeyLocation(),
                e.getStatus(), e.getFallback(), e.getLastCheckedAt(), e.getLastLatencyMs()
        );
    }

    private EndpointDto mapEndpoint(ApiEndpoint ep) {
        return new EndpointDto(
                ep.getId(), ep.getMethod(), ep.getPath(), ep.getSummary(),
                ep.getRequestExample(), ep.getResponseStatus(), ep.getResponseExample(),
                ep.isMockEnabled(), ep.getPosition()
        );
    }

    private static class RateLimitTracker {
        long windowStart;
        int count;

        RateLimitTracker(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
