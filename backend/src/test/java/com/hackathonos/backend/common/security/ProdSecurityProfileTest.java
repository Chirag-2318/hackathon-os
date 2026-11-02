package com.hackathonos.backend.common.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("prod")
@TestPropertySource(properties = {
        "DB_HOST=localhost",
        "DB_PORT=5432",
        "DB_NAME=hackathon_os?options=-c%20TimeZone=UTC",
        "DB_USERNAME=hackathon",
        "DB_PASSWORD=hackathon",
        "GITHUB_CLIENT_ID=real-client-id",
        "GITHUB_CLIENT_SECRET=real-client-secret",
        "GOOGLE_CLIENT_ID=real-google-id",
        "GOOGLE_CLIENT_SECRET=real-google-secret",
        "APP_PUBLIC_URL=https://bracket.app",
        "app.encryption-key=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        "app.admin-emails=admin@bracket.app",
        "app.support-email=support@bracket.app",
        "app.ai.platform-fallback=false",
        "app.startup-validation.enabled=false",
        "METRICS_TOKEN=secret-metrics-token-12345",
        "app.mail.enabled=false",
        "management.endpoints.web.exposure.include=health,metrics,prometheus",
        "management.endpoint.prometheus.enabled=true",
        "management.prometheus.metrics.export.enabled=true",
        "MAIL_PROVIDER=log"
})
class ProdSecurityProfileTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("Dev endpoints return 404 in production profile because controller beans are not registered")
    void testDevEndpointsReturn404InProd() throws Exception {
        mockMvc.perform(get("/api/v1/dev"))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/dev/demo-room"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/v1/dev/seed"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Public mock endpoints return 404 in production profile")
    void testMockEndpointsReturn404InProd() throws Exception {
        mockMvc.perform(get("/mock/test-token/users"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Health endpoint is shallow and returns 200 without auth")
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    @DisplayName("Actuator Prometheus requires valid METRICS_TOKEN bearer")
    void testPrometheusEndpointSecured() throws Exception {
        // Without token -> 401/403
        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(result -> {
                    int sc = result.getResponse().getStatus();
                    org.assertj.core.api.Assertions.assertThat(sc).isIn(401, 403);
                });

        // With invalid token -> 401/403
        mockMvc.perform(get("/actuator/prometheus")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(result -> {
                    int sc = result.getResponse().getStatus();
                    org.assertj.core.api.Assertions.assertThat(sc).isIn(401, 403);
                });

        // With valid token -> 200 OK
        mockMvc.perform(get("/actuator/prometheus")
                        .header("Authorization", "Bearer secret-metrics-token-12345"))
                .andExpect(status().isOk());
    }
}
