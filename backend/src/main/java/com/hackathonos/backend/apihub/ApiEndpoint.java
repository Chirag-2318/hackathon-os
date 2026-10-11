package com.hackathonos.backend.apihub;

import jakarta.persistence.*;
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
    private String method;

    @Column(name = "path", nullable = false)
    private String path;

    @Column(name = "summary")
    private String summary;

    @Column(name = "request_example", columnDefinition = "TEXT")
    private String requestExample;

    @Column(name = "response_status", nullable = false)
    private int responseStatus;

    @Column(name = "response_example", columnDefinition = "TEXT")
    private String responseExample;

    @Column(name = "mock_enabled", nullable = false)
    private boolean mockEnabled;

    @Column(name = "position", nullable = false)
    private int position;

    public ApiEndpoint() {}

    public ApiEndpoint(UUID roomId, String method, String path, String summary,
                       String requestExample, int responseStatus, String responseExample,
                       boolean mockEnabled, int position) {
        this.roomId = roomId;
        this.method = method;
        this.path = path;
        this.summary = summary;
        this.requestExample = requestExample;
        this.responseStatus = responseStatus > 0 ? responseStatus : 200;
        this.responseExample = responseExample;
        this.mockEnabled = mockEnabled;
        this.position = position;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getRequestExample() { return requestExample; }
    public void setRequestExample(String requestExample) { this.requestExample = requestExample; }

    public int getResponseStatus() { return responseStatus; }
    public void setResponseStatus(int responseStatus) { this.responseStatus = responseStatus; }

    public String getResponseExample() { return responseExample; }
    public void setResponseExample(String responseExample) { this.responseExample = responseExample; }

    public boolean isMockEnabled() { return mockEnabled; }
    public void setMockEnabled(boolean mockEnabled) { this.mockEnabled = mockEnabled; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
}
