package com.hackathonos.backend.apihub;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.UUID;

@Entity
@Table(name = "api_endpoints", uniqueConstraints = {
        @UniqueConstraint(name = "uq_api_endpoints_room_method_path", columnNames = {"room_id", "method", "path"})
})
public class ApiEndpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "method", nullable = false, length = 10)
    private String method; // 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'

    @Column(name = "path", nullable = false, length = 500)
    private String path;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "tag", length = 100)
    private String tag;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "request_schema", columnDefinition = "jsonb")
    private String requestSchema;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_schemas", columnDefinition = "jsonb")
    private String responseSchemas;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parameters", columnDefinition = "jsonb")
    private String parameters;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "mock_response", columnDefinition = "jsonb")
    private String mockResponse;

    @Column(name = "mock_status", nullable = false)
    private int mockStatus = 200;

    @Column(name = "auth_required", nullable = false)
    private boolean authRequired = false;

    @Column(name = "source", nullable = false, length = 20)
    private String source = "MANUAL"; // 'MANUAL', 'IMPORT', 'PLAN'

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "position", nullable = false)
    private int position = 0;

    @Column(name = "mock_enabled", nullable = false)
    private boolean mockEnabled = false;

    // Backwards compatibility columns
    @Column(name = "request_example", columnDefinition = "TEXT")
    private String requestExample;

    @Column(name = "response_status")
    private Integer responseStatus;

    @Column(name = "response_example", columnDefinition = "TEXT")
    private String responseExample;

    public ApiEndpoint() {}

    public ApiEndpoint(UUID roomId, String method, String path, String summary,
                       String description, String tag, String requestSchema,
                       String responseSchemas, String parameters, String mockResponse,
                       int mockStatus, boolean authRequired, String source,
                       UUID createdBy, int position, boolean mockEnabled) {
        this.roomId = roomId;
        this.method = method != null ? method.toUpperCase() : "GET";
        this.path = path;
        this.summary = summary;
        this.description = description;
        this.tag = tag;
        this.requestSchema = requestSchema;
        this.responseSchemas = responseSchemas;
        this.parameters = parameters;
        this.mockResponse = mockResponse;
        this.mockStatus = mockStatus > 0 ? mockStatus : 200;
        this.authRequired = authRequired;
        this.source = source != null ? source : "MANUAL";
        this.createdBy = createdBy;
        this.position = position;
        this.mockEnabled = mockEnabled;
        this.responseStatus = this.mockStatus;
        this.responseExample = this.mockResponse;
        this.requestExample = this.requestSchema;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method != null ? method.toUpperCase() : "GET"; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }

    public String getRequestSchema() { return requestSchema; }
    public void setRequestSchema(String requestSchema) {
        this.requestSchema = requestSchema;
        this.requestExample = requestSchema;
    }

    public String getResponseSchemas() { return responseSchemas; }
    public void setResponseSchemas(String responseSchemas) { this.responseSchemas = responseSchemas; }

    public String getParameters() { return parameters; }
    public void setParameters(String parameters) { this.parameters = parameters; }

    public String getMockResponse() { return mockResponse; }
    public void setMockResponse(String mockResponse) {
        this.mockResponse = mockResponse;
        this.responseExample = mockResponse;
    }

    public int getMockStatus() { return mockStatus; }
    public void setMockStatus(int mockStatus) {
        this.mockStatus = mockStatus;
        this.responseStatus = mockStatus;
    }

    public boolean isAuthRequired() { return authRequired; }
    public void setAuthRequired(boolean authRequired) { this.authRequired = authRequired; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public boolean isMockEnabled() { return mockEnabled; }
    public void setMockEnabled(boolean mockEnabled) { this.mockEnabled = mockEnabled; }

    public String getRequestExample() { return requestExample != null ? requestExample : requestSchema; }
    public void setRequestExample(String requestExample) {
        this.requestExample = requestExample;
        if (this.requestSchema == null) this.requestSchema = requestExample;
    }

    public int getResponseStatus() { return responseStatus != null && responseStatus > 0 ? responseStatus : mockStatus; }
    public void setResponseStatus(int responseStatus) {
        this.responseStatus = responseStatus;
        this.mockStatus = responseStatus;
    }

    public String getResponseExample() { return responseExample != null ? responseExample : mockResponse; }
    public void setResponseExample(String responseExample) {
        this.responseExample = responseExample;
        if (this.mockResponse == null) this.mockResponse = responseExample;
    }
}
