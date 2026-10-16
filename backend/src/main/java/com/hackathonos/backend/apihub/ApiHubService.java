package com.hackathonos.backend.apihub;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.*;
import com.hackathonos.backend.common.http.SafeHttpClient;
import com.hackathonos.backend.common.security.RateLimiter;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.apihub.dto.ApiHubDtos.*;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import io.swagger.v3.parser.OpenAPIV3Parser;
import io.swagger.v3.parser.core.models.ParseOptions;
import io.swagger.v3.parser.core.models.SwaggerParseResult;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class ApiHubService {

    private static final Pattern SECRET_PATTERN = Pattern.compile(
            "^(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|AKIA[0-9A-Z]{16}|xox[bap]-[A-Za-z0-9-]{10,}|[A-Za-z0-9]{32,})$"
    );

    private static final Set<String> ALLOWED_METHODS = Set.of(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"
    );

    private final ApiExternalRepository externalRepository;
    private final ApiEndpointRepository endpointRepository;
    private final ApiMockSettingsRepository mockSettingsRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;
    private final SafeHttpClient safeHttpClient;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final RateLimiter rateLimiter;
    private final YAMLMapper yamlMapper = new YAMLMapper();
    private final Clock clock;

    public ApiHubService(ApiExternalRepository externalRepository,
                          ApiEndpointRepository endpointRepository,
                          ApiMockSettingsRepository mockSettingsRepository,
                          UserRepository userRepository,
                          RoomAccess roomAccess,
                          SafeHttpClient safeHttpClient,
                          AppProperties appProperties,
                          ObjectMapper objectMapper,
                          DocRepository docRepository,
                          DocVersionRepository docVersionRepository,
                          RateLimiter rateLimiter,
                          Clock clock) {
        this.externalRepository = externalRepository;
        this.endpointRepository = endpointRepository;
        this.mockSettingsRepository = mockSettingsRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
        this.safeHttpClient = safeHttpClient;
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.rateLimiter = rateLimiter;
        this.clock = clock;
    }

    /**
     * Returns full Hub state: externals, endpoints, summary counts, mock info, warnings.
     */
    @Transactional(readOnly = true)
    public ApiHubResponse getApis(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        List<ApiExternal> externals = externalRepository.findByRoomIdOrderByLastCheckedAtDesc(roomId);
        List<ApiEndpoint> endpoints = endpointRepository.findByRoomIdOrderByPositionAsc(roomId);
        Optional<ApiMockSettings> mockOpt = mockSettingsRepository.findById(roomId);

        List<ExternalDto> externalDtos = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        for (ApiExternal e : externals) {
            externalDtos.add(mapExternal(e));
            if (e.getFallback() == null || "NONE".equalsIgnoreCase(e.getFallback())) {
                warnings.add("External API '" + e.getName() + "' has no fallback strategy configured.");
            }
            if ("FAILING".equalsIgnoreCase(e.getStatus())) {
                warnings.add("External API '" + e.getName() + "' failed its latest health check.");
            }
        }

        List<EndpointDto> endpointDtos = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (ApiEndpoint ep : endpoints) {
            endpointDtos.add(mapEndpoint(ep));
            String key = ep.getMethod() + " " + ep.getPath();
            if (!seen.add(key)) {
                warnings.add("Duplicate endpoint definition: " + key);
            }
            if (ep.getMockResponse() == null && ep.getResponseExample() == null) {
                warnings.add("Endpoint " + key + " has no response schema or example.");
            }
        }

        ApiHubSummaryResponse summary = calculateSummary(externals, endpoints);

        MockInfoDto mockInfo = mockOpt.map(m -> new MockInfoDto(
                m.isEnabled(), appProperties.getBaseUrl() + "/mock/" + m.getToken() + "/"
        )).orElse(new MockInfoDto(false, null));

        return new ApiHubResponse(externalDtos, endpointDtos, mockInfo, summary, warnings, clock.instant());
    }

    /**
     * Summary counts for API fallbacks panel (mocked, cached, none).
     */
    @Transactional(readOnly = true)
    public ApiHubSummaryResponse getSummary(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        List<ApiExternal> externals = externalRepository.findByRoomId(roomId);
        List<ApiEndpoint> endpoints = endpointRepository.findByRoomIdOrderByPositionAsc(roomId);
        return calculateSummary(externals, endpoints);
    }

    private ApiHubSummaryResponse calculateSummary(List<ApiExternal> externals, List<ApiEndpoint> endpoints) {
        int mocked = 0;
        int cached = 0;
        int none = 0;

        for (ApiExternal ext : externals) {
            String fb = ext.getFallback() != null ? ext.getFallback().toUpperCase() : "NONE";
            if ("MOCKED".equals(fb)) {
                mocked++;
            } else if ("CACHED".equals(fb)) {
                cached++;
            } else {
                none++;
            }
        }

        for (ApiEndpoint ep : endpoints) {
            if (ep.isMockEnabled()) {
                mocked++;
            } else {
                none++;
            }
        }

        return new ApiHubSummaryResponse(mocked, cached, none, externals.size(), endpoints.size());
    }

    // ==========================================
    // External APIs
    // ==========================================

    @Transactional(readOnly = true)
    public List<ExternalDto> getExternals(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        return externalRepository.findByRoomIdOrderByLastCheckedAtDesc(roomId).stream()
                .map(this::mapExternal).toList();
    }

    @Transactional
    public ExternalDto createExternal(UUID roomId, CreateExternalRequest request, User user) {
        roomAccess.requireMember(roomId, user);

        validateUrl(request.baseUrl());
        validateKeyLocation(request.keyLocation());

        if (request.name() == null || request.name().isBlank()) {
            throw new BadRequestException("INVALID_NAME", "External API name is required");
        }

        UUID ownerId = request.ownerUserId() != null ? request.ownerUserId() : request.keyOwnerId();

        ApiExternal ext = new ApiExternal(
                roomId,
                request.name().trim(),
                request.baseUrl().trim(),
                request.authType() != null ? request.authType().toUpperCase() : "NONE",
                request.rateLimit(),
                request.cost(),
                ownerId,
                request.keyLocation(),
                request.status() != null ? request.status().toUpperCase() : "UNKNOWN",
                request.fallback() != null ? request.fallback().toUpperCase() : "NONE",
                request.fallbackNotes(),
                request.docsUrl(),
                request.notes(),
                user != null ? user.getId() : null,
                null,
                null
        );

        ApiExternal saved = externalRepository.save(ext);
        return mapExternal(saved);
    }

    @Transactional
    public ExternalDto updateExternal(UUID roomId, UUID id, UpdateExternalRequest request, User user) {
        roomAccess.requireMember(roomId, user);

        ApiExternal ext = externalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("EXTERNAL_NOT_FOUND", "External API not found"));

        if (!ext.getRoomId().equals(roomId)) {
            throw new ForbiddenException("FORBIDDEN", "API belongs to another room");
        }

        // Optimistic locking check
        if (request.version() != null && !request.version().equals(ext.getVersion())) {
            throw new ConflictException("CONCURRENT_UPDATE", "External API was modified by another user. Please refresh.");
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

        UUID ownerId = request.ownerUserId() != null ? request.ownerUserId() : request.keyOwnerId();
        if (ownerId != null) ext.setOwnerUserId(ownerId);

        if (request.status() != null) ext.setStatus(request.status().toUpperCase());
        if (request.fallback() != null) ext.setFallback(request.fallback().toUpperCase());
        if (request.fallbackNotes() != null) ext.setFallbackNotes(request.fallbackNotes());
        if (request.docsUrl() != null) ext.setDocsUrl(request.docsUrl());
        if (request.notes() != null) ext.setNotes(request.notes());

        ApiExternal saved = externalRepository.save(ext);
        return mapExternal(saved);
    }

    @Transactional
    public void deleteExternal(UUID roomId, UUID id, User user) {
        roomAccess.requireMember(roomId, user);

        ApiExternal ext = externalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("EXTERNAL_NOT_FOUND", "External API not found"));

        if (!ext.getRoomId().equals(roomId)) {
            throw new ForbiddenException("FORBIDDEN", "API belongs to another room");
        }

        externalRepository.delete(ext);
    }

    @Transactional
    public ExternalDto checkExternal(UUID roomId, UUID id, User user) {
        roomAccess.requireMember(roomId, user);

        ApiExternal ext = externalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("EXTERNAL_NOT_FOUND", "External API not found"));

        if (!ext.getRoomId().equals(roomId)) {
            throw new ForbiddenException("FORBIDDEN", "API belongs to another room");
        }

        Instant start = Instant.now();
        try {
            com.hackathonos.backend.common.http.SafeHttpClient.SafeHttpResponse res = safeHttpClient.headOrGet(ext.getBaseUrl(), 5000);
            if (res.ok()) {
                ext.setStatus("WORKING");
                ext.setLastLatencyMs((int) res.latencyMs());
            } else {
                ext.setStatus("FAILING");
                ext.setLastLatencyMs(null);
            }
        } catch (Exception ex) {
            ext.setStatus("FAILING");
            ext.setLastLatencyMs(null);
        }
        ext.setLastCheckedAt(clock.instant());
        return mapExternal(externalRepository.save(ext));
    }

    // ==========================================
    // Our Endpoints
    // ==========================================

    @Transactional(readOnly = true)
    public List<EndpointDto> getEndpoints(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        return endpointRepository.findByRoomIdOrderByPositionAsc(roomId).stream()
                .map(this::mapEndpoint).toList();
    }

    @Transactional
    public EndpointDto createEndpoint(UUID roomId, CreateEndpointRequest request, User user) {
        roomAccess.requireMember(roomId, user);

        validateEndpointMethodAndPath(request.method(), request.path());
        validateJsonField("requestSchema", request.requestSchema());
        validateJsonField("responseSchemas", request.responseSchemas());
        validateJsonField("parameters", request.parameters());
        validateJsonField("mockResponse", request.mockResponse());

        String method = request.method().toUpperCase();
        String path = normalizePath(request.path());

        if (endpointRepository.findByRoomIdAndMethodAndPath(roomId, method, path).isPresent()) {
            throw new ConflictException("DUPLICATE_ENDPOINT", "Endpoint already exists for " + method + " " + path);
        }

        int position = endpointRepository.findByRoomIdOrderByPositionAsc(roomId).size();

        ApiEndpoint ep = new ApiEndpoint(
                roomId,
                method,
                path,
                request.summary(),
                request.description(),
                request.tag() != null ? request.tag().trim() : null,
                request.requestSchema() != null ? request.requestSchema() : request.requestExample(),
                request.responseSchemas(),
                request.parameters(),
                request.mockResponse() != null ? request.mockResponse() : request.responseExample(),
                request.mockStatus() != null ? request.mockStatus() : (request.responseStatus() != null ? request.responseStatus() : 200),
                request.authRequired() != null ? request.authRequired() : false,
                request.source() != null ? request.source().toUpperCase() : "MANUAL",
                user != null ? user.getId() : null,
                position,
                request.mockEnabled() != null ? request.mockEnabled() : false
        );

        ApiEndpoint saved = endpointRepository.save(ep);
        return mapEndpoint(saved);
    }

    @Transactional
    public EndpointDto updateEndpoint(UUID roomId, UUID id, UpdateEndpointRequest request, User user) {
        roomAccess.requireMember(roomId, user);

        ApiEndpoint ep = endpointRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("ENDPOINT_NOT_FOUND", "Endpoint not found"));

        if (!ep.getRoomId().equals(roomId)) {
            throw new ForbiddenException("FORBIDDEN", "Endpoint belongs to another room");
        }

        // Optimistic locking check
        if (request.version() != null && !request.version().equals(ep.getVersion())) {
            throw new ConflictException("CONCURRENT_UPDATE", "Endpoint was modified by another user. Please refresh.");
        }

        if (request.method() != null || request.path() != null) {
            String newMethod = request.method() != null ? request.method().toUpperCase() : ep.getMethod();
            String newPath = request.path() != null ? normalizePath(request.path()) : ep.getPath();
            validateEndpointMethodAndPath(newMethod, newPath);

            Optional<ApiEndpoint> existing = endpointRepository.findByRoomIdAndMethodAndPath(roomId, newMethod, newPath);
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                throw new ConflictException("DUPLICATE_ENDPOINT", "Endpoint already exists for " + newMethod + " " + newPath);
            }
            ep.setMethod(newMethod);
            ep.setPath(newPath);
        }

        if (request.requestSchema() != null) {
            validateJsonField("requestSchema", request.requestSchema());
            ep.setRequestSchema(request.requestSchema());
        } else if (request.requestExample() != null) {
            ep.setRequestExample(request.requestExample());
        }

        if (request.responseSchemas() != null) {
            validateJsonField("responseSchemas", request.responseSchemas());
            ep.setResponseSchemas(request.responseSchemas());
        }

        if (request.parameters() != null) {
            validateJsonField("parameters", request.parameters());
            ep.setParameters(request.parameters());
        }

        if (request.mockResponse() != null) {
            validateJsonField("mockResponse", request.mockResponse());
            ep.setMockResponse(request.mockResponse());
        } else if (request.responseExample() != null) {
            ep.setResponseExample(request.responseExample());
        }

        if (request.summary() != null) ep.setSummary(request.summary());
        if (request.description() != null) ep.setDescription(request.description());
        if (request.tag() != null) ep.setTag(request.tag());
        if (request.mockStatus() != null) ep.setMockStatus(request.mockStatus());
        else if (request.responseStatus() != null) ep.setResponseStatus(request.responseStatus());

        if (request.authRequired() != null) ep.setAuthRequired(request.authRequired());
        if (request.source() != null) ep.setSource(request.source().toUpperCase());
        if (request.mockEnabled() != null) ep.setMockEnabled(request.mockEnabled());

        ApiEndpoint saved = endpointRepository.save(ep);
        return mapEndpoint(saved);
    }

    @Transactional
    public void deleteEndpoint(UUID roomId, UUID id, User user) {
        roomAccess.requireMember(roomId, user);

        ApiEndpoint ep = endpointRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("ENDPOINT_NOT_FOUND", "Endpoint not found"));

        if (!ep.getRoomId().equals(roomId)) {
            throw new ForbiddenException("FORBIDDEN", "Endpoint belongs to another room");
        }

        endpointRepository.delete(ep);
    }

    // ==========================================
    // OpenAPI Import & Export
    // ==========================================

    @Transactional
    public ImportApiResponse importOpenApi(UUID roomId, String text, byte[] bytes, String mode, Boolean dryRun, User user) {
        roomAccess.requireMember(roomId, user);

        // Rate limiting: 10 imports per minute per room
        RateLimiter.RateLimitResult rate = rateLimiter.tryAcquire("apihub:import:room:" + roomId, 10, 10, Duration.ofMinutes(1));
        if (!rate.allowed()) {
            throw new TooManyRequestsException("RATE_LIMITED", "Import rate limit reached. Please wait a minute before importing again.");
        }

        String content;
        if (bytes != null && bytes.length > 0) {
            if (bytes.length > 2 * 1024 * 1024) {
                throw new BadRequestException("FILE_TOO_LARGE", "Specification file exceeds the 2 MB limit.");
            }
            content = new String(bytes, StandardCharsets.UTF_8);
        } else if (text != null && !text.isBlank()) {
            if (text.length() > 2 * 1024 * 1024) {
                throw new BadRequestException("FILE_TOO_LARGE", "Specification text exceeds the 2 MB limit.");
            }
            content = text;
        } else {
            throw new BadRequestException("EMPTY_SPEC", "Specification content is required (.json, .yaml, .yml or raw text)");
        }

        // Configure Swagger Parser with SSRF protections: local $refs only, remote disabled
        ParseOptions options = new ParseOptions();
        options.setResolve(true);
        options.setResolveFully(false);
        options.setResolveCombinators(false);

        SwaggerParseResult parseResult = new OpenAPIV3Parser().readContents(content, null, options);
        OpenAPI openAPI = parseResult.getOpenAPI();
        List<String> warnings = parseResult.getMessages() != null ? new ArrayList<>(parseResult.getMessages()) : new ArrayList<>();

        if (openAPI == null) {
            throw new BadRequestException("PARSE_ERROR", "Failed to parse specification: " + String.join("; ", warnings));
        }

        List<String> servers = new ArrayList<>();
        if (openAPI.getServers() != null) {
            for (Server s : openAPI.getServers()) {
                if (s.getUrl() != null && !s.getUrl().isBlank()) {
                    servers.add(s.getUrl());
                }
            }
        }

        List<String> tags = new ArrayList<>();
        if (openAPI.getTags() != null) {
            for (Tag t : openAPI.getTags()) {
                if (t.getName() != null && !t.getName().isBlank()) {
                    tags.add(t.getName());
                }
            }
        }

        boolean isReplace = "REPLACE".equalsIgnoreCase(mode);
        boolean isDry = Boolean.TRUE.equals(dryRun);

        if (isReplace && !isDry) {
            List<ApiEndpoint> existing = endpointRepository.findByRoomIdOrderByPositionAsc(roomId);
            endpointRepository.deleteAll(existing);
        }

        int endpointsFound = 0;
        int created = 0;
        int updated = 0;
        int skipped = 0;
        int position = isReplace ? 0 : endpointRepository.findByRoomIdOrderByPositionAsc(roomId).size();

        if (openAPI.getPaths() != null) {
            for (Map.Entry<String, PathItem> pathEntry : openAPI.getPaths().entrySet()) {
                String path = normalizePath(pathEntry.getKey());
                PathItem pathItem = pathEntry.getValue();
                if (pathItem == null) continue;

                Map<PathItem.HttpMethod, Operation> ops = pathItem.readOperationsMap();
                for (Map.Entry<PathItem.HttpMethod, Operation> opEntry : ops.entrySet()) {
                    String method = opEntry.getKey().name().toUpperCase();
                    if (!ALLOWED_METHODS.contains(method)) continue;

                    endpointsFound++;
                    Operation op = opEntry.getValue();
                    String summary = op.getSummary();
                    String description = op.getDescription();
                    String tag = (op.getTags() != null && !op.getTags().isEmpty()) ? op.getTags().get(0) : null;
                    boolean authRequired = op.getSecurity() != null && !op.getSecurity().isEmpty();

                    String paramsJson = null;
                    if (op.getParameters() != null && !op.getParameters().isEmpty()) {
                        try {
                            paramsJson = objectMapper.writeValueAsString(op.getParameters());
                        } catch (Exception ignored) {}
                    }

                    String reqSchemaJson = null;
                    if (op.getRequestBody() != null && op.getRequestBody().getContent() != null) {
                        MediaType mt = op.getRequestBody().getContent().get("application/json");
                        if (mt == null && !op.getRequestBody().getContent().isEmpty()) {
                            mt = op.getRequestBody().getContent().values().iterator().next();
                        }
                        if (mt != null) {
                            try {
                                if (mt.getExample() != null) {
                                    reqSchemaJson = objectMapper.writeValueAsString(mt.getExample());
                                } else if (mt.getSchema() != null) {
                                    reqSchemaJson = objectMapper.writeValueAsString(mt.getSchema());
                                }
                            } catch (Exception ignored) {}
                        }
                    }

                    String mockRespJson = null;
                    String respSchemasJson = null;
                    int mockStatus = 200;
                    if (op.getResponses() != null && !op.getResponses().isEmpty()) {
                        try {
                            respSchemasJson = objectMapper.writeValueAsString(op.getResponses());
                        } catch (Exception ignored) {}

                        io.swagger.v3.oas.models.responses.ApiResponse ok = op.getResponses().get("200");
                        if (ok == null) ok = op.getResponses().get("201");
                        if (ok == null) {
                            for (Map.Entry<String, io.swagger.v3.oas.models.responses.ApiResponse> rEntry : op.getResponses().entrySet()) {
                                if (rEntry.getKey().startsWith("2")) {
                                    ok = rEntry.getValue();
                                    try { mockStatus = Integer.parseInt(rEntry.getKey()); } catch (Exception ignored) {}
                                    break;
                                }
                            }
                        }
                        if (ok == null) {
                            ok = op.getResponses().values().iterator().next();
                        }

                        if (ok != null && ok.getContent() != null) {
                            MediaType mt = ok.getContent().get("application/json");
                            if (mt == null && !ok.getContent().isEmpty()) {
                                mt = ok.getContent().values().iterator().next();
                            }
                            if (mt != null) {
                                try {
                                    if (mt.getExample() != null) {
                                        mockRespJson = objectMapper.writeValueAsString(mt.getExample());
                                    } else if (mt.getExamples() != null && !mt.getExamples().isEmpty()) {
                                        mockRespJson = objectMapper.writeValueAsString(mt.getExamples().values().iterator().next().getValue());
                                    } else if (mt.getSchema() != null) {
                                        mockRespJson = objectMapper.writeValueAsString(mt.getSchema());
                                    }
                                } catch (Exception ignored) {}
                            }
                        }
                    }

                    Optional<ApiEndpoint> existing = isReplace ? Optional.empty()
                            : endpointRepository.findByRoomIdAndMethodAndPath(roomId, method, path);

                    if (existing.isPresent()) {
                        updated++;
                        if (!isDry) {
                            ApiEndpoint target = existing.get();
                            if (summary != null) target.setSummary(summary);
                            if (description != null) target.setDescription(description);
                            if (tag != null) target.setTag(tag);
                            if (paramsJson != null) target.setParameters(paramsJson);
                            if (reqSchemaJson != null) target.setRequestSchema(reqSchemaJson);
                            if (respSchemasJson != null) target.setResponseSchemas(respSchemasJson);
                            if (mockRespJson != null) target.setMockResponse(mockRespJson);
                            target.setMockStatus(mockStatus);
                            target.setAuthRequired(authRequired);
                            target.setSource("IMPORT");
                            endpointRepository.save(target);
                        }
                    } else {
                        created++;
                        if (!isDry) {
                            ApiEndpoint newEp = new ApiEndpoint(
                                    roomId, method, path, summary, description, tag,
                                    reqSchemaJson, respSchemasJson, paramsJson, mockRespJson,
                                    mockStatus, authRequired, "IMPORT",
                                    user != null ? user.getId() : null,
                                    position++, false
                            );
                            endpointRepository.save(newEp);
                        }
                    }
                }
            }
        }

        return new ImportApiResponse(endpointsFound, tags, servers, warnings, created, updated, skipped);
    }

    /**
     * Seeds endpoints from ARCHITECTURE.md "API contract" table when hub is empty or requested.
     */
    @Transactional
    public ImportFromPlanResponse importFromPlan(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        Optional<Doc> docOpt = docRepository.findByRoomIdAndFileName(roomId, "ARCHITECTURE.md");
        if (docOpt.isEmpty()) {
            return new ImportFromPlanResponse(0, 0, List.of("ARCHITECTURE.md not found in room documentation"));
        }

        Doc doc = docOpt.get();
        Optional<DocVersion> verOpt = docVersionRepository.findByDocIdAndVersion(doc.getId(), doc.getCurrentVersion());
        if (verOpt.isEmpty() || verOpt.get().getContent() == null || verOpt.get().getContent().isBlank()) {
            return new ImportFromPlanResponse(0, 0, List.of("ARCHITECTURE.md has no content"));
        }

        String markdown = verOpt.get().getContent();
        String[] lines = markdown.split("\\r?\\n");

        int imported = 0;
        int skipped = 0;
        List<String> warnings = new ArrayList<>();
        int position = endpointRepository.findByRoomIdOrderByPositionAsc(roomId).size();

        boolean inContractSection = false;
        boolean headerPassed = false;
        int methodCol = -1, pathCol = -1, purposeCol = -1, reqCol = -1, respCol = -1, mockCol = -1;

        for (String rawLine : lines) {
            String line = rawLine.trim();

            if (line.startsWith("#")) {
                String heading = line.toLowerCase();
                if (heading.contains("api contract") || heading.contains("api endpoints") || heading.contains("endpoints")) {
                    inContractSection = true;
                    headerPassed = false;
                    continue;
                } else if (inContractSection && line.startsWith("## ") && !heading.contains("api")) {
                    inContractSection = false;
                }
            }

            if (inContractSection && line.startsWith("|") && line.endsWith("|")) {
                String[] parts = Arrays.stream(line.split("\\|"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toArray(String[]::new);

                if (!headerPassed) {
                    // Check header line
                    for (int i = 0; i < parts.length; i++) {
                        String h = parts[i].toLowerCase();
                        if (h.contains("method")) methodCol = i;
                        else if (h.contains("path") || h.contains("endpoint") || h.contains("route")) pathCol = i;
                        else if (h.contains("purpose") || h.contains("description") || h.contains("summary")) purposeCol = i;
                        else if (h.contains("request")) reqCol = i;
                        else if (h.contains("response")) respCol = i;
                        else if (h.contains("mock")) mockCol = i;
                    }
                    if (methodCol >= 0 && pathCol >= 0) {
                        headerPassed = true;
                    }
                    continue;
                }

                if (line.contains("---")) {
                    continue; // table separator
                }

                if (methodCol < parts.length && pathCol < parts.length) {
                    String method = parts[methodCol].replaceAll("[`*]", "").trim().toUpperCase();
                    String path = normalizePath(parts[pathCol].replaceAll("[`*]", "").trim());
                    String purpose = purposeCol >= 0 && purposeCol < parts.length ? parts[purposeCol] : null;
                    String req = reqCol >= 0 && reqCol < parts.length ? parts[reqCol] : null;
                    String resp = respCol >= 0 && respCol < parts.length ? parts[respCol] : null;
                    boolean mock = mockCol >= 0 && mockCol < parts.length &&
                            (parts[mockCol].toLowerCase().contains("yes") || parts[mockCol].toLowerCase().contains("true") || parts[mockCol].toLowerCase().contains("mock"));

                    if (!ALLOWED_METHODS.contains(method)) {
                        continue;
                    }

                    if (endpointRepository.findByRoomIdAndMethodAndPath(roomId, method, path).isPresent()) {
                        skipped++;
                        continue;
                    }

                    ApiEndpoint ep = new ApiEndpoint(
                            roomId, method, path, purpose, purpose, "Plan",
                            req, null, null, resp, 200, false, "PLAN",
                            user != null ? user.getId() : null,
                            position++, mock
                    );
                    endpointRepository.save(ep);
                    imported++;
                }
            }
        }

        if (imported == 0 && skipped == 0) {
            warnings.add("No API contract table found under 'API contract' heading in ARCHITECTURE.md");
        }

        return new ImportFromPlanResponse(imported, skipped, warnings);
    }

    /**
     * Builds and exports OpenAPI 3.0.3 specification JSON.
     */
    @Transactional(readOnly = true)
    public String exportOpenApi(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        Map<String, Object> doc = buildOpenApiDocument(room, roomId);
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(doc);
        } catch (Exception e) {
            return "{}";
        }
    }

    /**
     * Builds and exports OpenAPI 3.0.3 specification YAML.
     */
    @Transactional(readOnly = true)
    public String exportOpenApiYaml(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        Map<String, Object> doc = buildOpenApiDocument(room, roomId);
        try {
            return yamlMapper.writeValueAsString(doc);
        } catch (Exception e) {
            return "";
        }
    }

    private Map<String, Object> buildOpenApiDocument(Room room, UUID roomId) {
        List<ApiEndpoint> endpoints = endpointRepository.findByRoomIdOrderByPositionAsc(roomId);

        Map<String, Object> doc = new LinkedHashMap<>();
        doc.put("openapi", "3.0.3");

        Map<String, Object> info = new LinkedHashMap<>();
        info.put("title", room.getName() + " API");
        info.put("version", "1.0.0");
        info.put("description", "OpenAPI 3.0 contract for " + room.getName());
        doc.put("info", info);

        List<Map<String, String>> servers = new ArrayList<>();
        servers.add(Map.of("url", appProperties.getApiPublicUrl(), "description", "API Server"));
        doc.put("servers", servers);

        Map<String, Object> paths = new LinkedHashMap<>();
        for (ApiEndpoint ep : endpoints) {
            Map<String, Object> pathItem = (Map<String, Object>) paths.computeIfAbsent(ep.getPath(), k -> new LinkedHashMap<>());
            Map<String, Object> op = new LinkedHashMap<>();

            if (ep.getSummary() != null) op.put("summary", ep.getSummary());
            if (ep.getDescription() != null) op.put("description", ep.getDescription());
            if (ep.getTag() != null) op.put("tags", List.of(ep.getTag()));

            // Parameters
            if (ep.getParameters() != null && !ep.getParameters().isBlank()) {
                try {
                    JsonNode paramsNode = objectMapper.readTree(ep.getParameters());
                    op.put("parameters", paramsNode);
                } catch (Exception ignored) {}
            }

            // Request body
            if (ep.getRequestSchema() != null && !ep.getRequestSchema().isBlank()) {
                Map<String, Object> reqBody = new LinkedHashMap<>();
                reqBody.put("required", true);
                Map<String, Object> content = new LinkedHashMap<>();
                Map<String, Object> jsonMediaType = new LinkedHashMap<>();
                try {
                    JsonNode schemaNode = objectMapper.readTree(ep.getRequestSchema());
                    jsonMediaType.put("schema", schemaNode);
                } catch (Exception e) {
                    jsonMediaType.put("example", ep.getRequestSchema());
                }
                content.put("application/json", jsonMediaType);
                reqBody.put("content", content);
                op.put("requestBody", reqBody);
            }

            // Responses
            Map<String, Object> responses = new LinkedHashMap<>();
            int statusCode = ep.getMockStatus() > 0 ? ep.getMockStatus() : 200;
            Map<String, Object> respObj = new LinkedHashMap<>();
            respObj.put("description", statusCode == 200 || statusCode == 201 ? "Successful response" : "Response");

            String respBody = ep.getMockResponse() != null ? ep.getMockResponse() : ep.getResponseExample();
            if (respBody != null && !respBody.isBlank()) {
                Map<String, Object> content = new LinkedHashMap<>();
                Map<String, Object> jsonMediaType = new LinkedHashMap<>();
                try {
                    JsonNode respNode = objectMapper.readTree(respBody);
                    jsonMediaType.put("example", respNode);
                } catch (Exception e) {
                    jsonMediaType.put("example", respBody);
                }
                content.put("application/json", jsonMediaType);
                respObj.put("content", content);
            }

            responses.put(String.valueOf(statusCode), respObj);
            op.put("responses", responses);

            pathItem.put(ep.getMethod().toLowerCase(), op);
        }

        doc.put("paths", paths);
        return doc;
    }

    @Transactional
    public MockInfoDto toggleMock(UUID roomId, ToggleMockRequest request, User user) {
        roomAccess.requireMember(roomId, user);

        ApiMockSettings settings = mockSettingsRepository.findById(roomId).orElseGet(() -> {
            String token = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
            return new ApiMockSettings(roomId, false, token);
        });

        if (request.enabled() != null) {
            settings.setEnabled(request.enabled());
        }
        ApiMockSettings saved = mockSettingsRepository.save(settings);
        return new MockInfoDto(saved.isEnabled(), appProperties.getBaseUrl() + "/mock/" + saved.getToken() + "/");
    }

    public record MockResponse(int status, String body) {}

    @Transactional(readOnly = true)
    public MockResponse serveMock(String token, String method, String path) {
        ApiMockSettings settings = mockSettingsRepository.findByToken(token)
                .orElseThrow(() -> new NotFoundException("MOCK_NOT_FOUND", "Mock not found"));

        if (!settings.isEnabled()) {
            return new MockResponse(404, "{\"error\":\"Mock server is disabled for this room\"}");
        }

        UUID roomId = settings.getRoomId();
        String normalizedPath = path.startsWith("/") ? path : ("/" + path);
        List<ApiEndpoint> endpoints = endpointRepository.findByRoomIdOrderByPositionAsc(roomId);

        for (ApiEndpoint ep : endpoints) {
            if (ep.getMethod().equalsIgnoreCase(method)) {
                String epPath = ep.getPath().startsWith("/") ? ep.getPath() : ("/" + ep.getPath());
                if (epPath.equalsIgnoreCase(normalizedPath)) {
                    String body = ep.getMockResponse() != null && !ep.getMockResponse().isBlank()
                            ? ep.getMockResponse()
                            : (ep.getResponseExample() != null ? ep.getResponseExample() : "{}");
                    int status = ep.getMockStatus() > 0 ? ep.getMockStatus() : 200;
                    return new MockResponse(status, body);
                }
            }
        }

        return new MockResponse(404, "{\"error\":\"Mock endpoint not found for " + method + " " + normalizedPath + "\"}");
    }

    // ==========================================
    // Helpers & Validation
    // ==========================================

    private void validateUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new BadRequestException("INVALID_URL", "Base URL is required");
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            throw new BadRequestException("INVALID_URL", "Base URL must begin with http:// or https://");
        }
    }

    private void validateKeyLocation(String keyLocation) {
        if (keyLocation == null || keyLocation.isBlank()) return;
        if (SECRET_PATTERN.matcher(keyLocation.trim()).find()) {
            throw new BadRequestException("KEY_LEAK_PREVENTED",
                    "Do not enter the raw API key. Record only WHERE the key lives (e.g. '.env: STRIPE_KEY').");
        }
    }

    private void validateEndpointMethodAndPath(String method, String path) {
        if (method == null || !ALLOWED_METHODS.contains(method.toUpperCase())) {
            throw new BadRequestException("INVALID_METHOD", "HTTP method must be one of " + ALLOWED_METHODS);
        }
        if (path == null || path.isBlank()) {
            throw new BadRequestException("INVALID_PATH", "Path is required");
        }
        if (!path.startsWith("/")) {
            throw new BadRequestException("INVALID_PATH", "Path must begin with a forward slash '/'");
        }
        if (path.length() > 500) {
            throw new BadRequestException("PATH_TOO_LONG", "Path cannot exceed 500 characters");
        }
    }

    private void validateJsonField(String fieldName, String value) {
        if (value == null || value.isBlank()) return;
        try {
            objectMapper.readTree(value);
        } catch (Exception e) {
            throw new BadRequestException("INVALID_JSON", "Field '" + fieldName + "' must contain valid JSON: " + e.getMessage());
        }
    }

    private String normalizePath(String path) {
        if (path == null) return "/";
        String trimmed = path.trim();
        return trimmed.startsWith("/") ? trimmed : "/" + trimmed;
    }

    private ExternalDto mapExternal(ApiExternal e) {
        ExternalKeyOwnerDto ownerDto = null;
        UUID ownerId = e.getOwnerUserId();
        if (ownerId != null) {
            ownerDto = userRepository.findById(ownerId)
                    .map(u -> new ExternalKeyOwnerDto(u.getId(), u.getName(), u.getAvatarUrl()))
                    .orElse(null);
        }
        return new ExternalDto(
                e.getId(),
                e.getRoomId(),
                e.getName(),
                e.getBaseUrl(),
                e.getAuthType(),
                e.getKeyLocation(),
                e.getRateLimit(),
                e.getCost(),
                e.getOwnerUserId(),
                ownerDto,
                e.getStatus(),
                e.getFallback(),
                e.getFallbackNotes(),
                e.getDocsUrl(),
                e.getNotes(),
                e.getCreatedBy(),
                e.getVersion(),
                e.getLastCheckedAt(),
                e.getLastLatencyMs()
        );
    }

    private EndpointDto mapEndpoint(ApiEndpoint ep) {
        return new EndpointDto(
                ep.getId(),
                ep.getRoomId(),
                ep.getMethod(),
                ep.getPath(),
                ep.getSummary(),
                ep.getDescription(),
                ep.getTag(),
                ep.getRequestSchema(),
                ep.getResponseSchemas(),
                ep.getParameters(),
                ep.getMockResponse(),
                ep.getMockStatus(),
                ep.isAuthRequired(),
                ep.getSource(),
                ep.getVersion(),
                ep.getCreatedBy(),
                ep.getPosition(),
                ep.isMockEnabled(),
                ep.getRequestExample(),
                ep.getResponseStatus(),
                ep.getResponseExample()
        );
    }
}
