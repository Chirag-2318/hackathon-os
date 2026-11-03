package com.hackathonos.backend.loadtest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("loadtest")
class LoadtestSeedIntegrationTest {

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
    @DisplayName("Loadtest status returns ready in loadtest profile")
    void testStatus() throws Exception {
        mockMvc.perform(get("/api/v1/loadtest/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ready").value(true))
                .andExpect(jsonPath("$.profile").value("loadtest"));
    }

    @Test
    @DisplayName("Loadtest seed creates users, rooms, tasks, docs, and valid sessions")
    void testSeed() throws Exception {
        String payload = """
                {
                    "userCount": 5,
                    "roomCount": 1,
                    "tasksPerRoom": 3,
                    "docsPerRoom": 2,
                    "ideasPerRoom": 2
                }
                """;

        mockMvc.perform(post("/api/v1/loadtest/seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userCount").value(5))
                .andExpect(jsonPath("$.roomCount").value(1))
                .andExpect(jsonPath("$.taskCount").value(3))
                .andExpect(jsonPath("$.docCount").value(2))
                .andExpect(jsonPath("$.ideaCount").value(2))
                .andExpect(jsonPath("$.users", hasSize(5)))
                .andExpect(jsonPath("$.users[0].sessionId").isNotEmpty())
                .andExpect(jsonPath("$.users[0].csrfToken").isNotEmpty())
                .andExpect(jsonPath("$.rooms", hasSize(1)));
    }

    @Test
    @DisplayName("Loadtest session endpoint returns valid session for existing user")
    void testSession() throws Exception {
        // Ensure user is seeded first
        String seedPayload = """
                {
                    "userCount": 2,
                    "roomCount": 1,
                    "tasksPerRoom": 1,
                    "docsPerRoom": 1,
                    "ideasPerRoom": 1
                }
                """;
        mockMvc.perform(post("/api/v1/loadtest/seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(seedPayload))
                .andExpect(status().isOk());

        String sessionPayload = """
                {
                    "email": "loadtest_user_1@bracket.loadtest"
                }
                """;

        mockMvc.perform(post("/api/v1/loadtest/session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sessionPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").isNotEmpty())
                .andExpect(jsonPath("$.csrfToken").isNotEmpty());
    }

    @Test
    @DisplayName("Loadtest mock AI completions returns valid response in fast mode")
    void testMockAiCompletions() throws Exception {
        mockMvc.perform(post("/api/v1/loadtest/mock-ai/chat/completions?fast=true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"messages\":[{\"role\":\"user\",\"content\":\"Generate a plan\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.choices[0].message.content").isNotEmpty());
    }
}
