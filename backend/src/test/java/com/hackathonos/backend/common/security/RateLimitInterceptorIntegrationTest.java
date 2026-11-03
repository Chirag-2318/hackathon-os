package com.hackathonos.backend.common.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("dev")
class RateLimitInterceptorIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("150 unauthenticated requests from 150 distinct x-vercel-forwarded-for visitor IPs: none is limited")
    void test150DistinctVisitorIpsAreNotLimited() throws Exception {
        for (int i = 1; i <= 150; i++) {
            // Distinct IPv4 literal for each request
            String visitorIp = "203.0.113." + (i % 250);
            mockMvc.perform(get("/api/v1/meta")
                            .header("x-vercel-forwarded-for", visitorIp)
                            .header("X-Forwarded-For", visitorIp + ", 76.76.21.21")
                            .with(request -> {
                                request.setRemoteAddr("76.76.21.21");
                                return request;
                            }))
                    .andExpect(status().isOk());
        }
    }

    @Test
    @DisplayName("130 unauthenticated requests from a single IP to non-exempt endpoint: first 120 succeed, 121..130 return 429 with Retry-After")
    void testSingleIpRateLimitingKicksInOnlyAfterThreshold() throws Exception {
        String testIp = "198.51.100.77";

        int successCount = 0;
        int limitedCount = 0;

        for (int i = 1; i <= 130; i++) {
            var result = mockMvc.perform(get("/api/v1/meta")
                            .header("x-vercel-forwarded-for", testIp)
                            .header("X-Forwarded-For", testIp + ", 76.76.21.21")
                            .with(request -> {
                                request.setRemoteAddr("76.76.21.21");
                                return request;
                            }))
                    .andReturn();

            int statusCode = result.getResponse().getStatus();
            if (statusCode == 200) {
                successCount++;
            } else if (statusCode == 429) {
                limitedCount++;
                String retryAfter = result.getResponse().getHeader("Retry-After");
                assertThat(retryAfter).isNotNull().isNotBlank();
            }
        }

        // Configured threshold is 120 req/min
        assertThat(successCount).isEqualTo(120);
        assertThat(limitedCount).isEqualTo(10);
    }

    @Test
    @DisplayName("OAuth callback and authorization paths are never limited by the global interceptor")
    void testOAuthPathsAreNeverLimited() throws Exception {
        String testIp = "198.51.100.88";

        // Send 130 requests to OAuth endpoints - none should ever receive HTTP 429 from rate limiting
        for (int i = 1; i <= 130; i++) {
            var result = mockMvc.perform(get("/oauth2/authorization/github")
                            .header("x-vercel-forwarded-for", testIp)
                            .with(request -> {
                                request.setRemoteAddr("76.76.21.21");
                                return request;
                            }))
                    .andReturn();

            // OAuth endpoints redirect to provider (302) or error, but never 429
            assertThat(result.getResponse().getStatus()).isNotEqualTo(429);
        }
    }

    @Test
    @DisplayName("Exempt public endpoints (/api/v1/me, /api/v1/public/config, /api/v1/public/capacity) have generous 300/min cap and allow 130 calls")
    void testExemptEndpointsAllowMoreThanUnauthLimit() throws Exception {
        String exemptIp = "198.51.100.99";

        // 130 calls to /api/v1/public/capacity - exceeds unauth 120 limit, but within 300 exempt limit
        for (int i = 1; i <= 130; i++) {
            mockMvc.perform(get("/api/v1/public/capacity")
                            .header("x-vercel-forwarded-for", exemptIp)
                            .with(request -> {
                                request.setRemoteAddr("76.76.21.21");
                                return request;
                            }))
                    .andExpect(status().isOk());
        }
    }
}

