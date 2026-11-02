package com.hackathonos.backend.mcp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.billing.UserPlan;
import com.hackathonos.backend.billing.UserPlanRepository;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.mcp.dto.McpSubmitRequest;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("dev")
class McpIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserPlanRepository userPlanRepository;

    @Autowired
    private McpTokenRepository mcpTokenRepository;

    @Autowired
    private McpTokenService mcpTokenService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private BriefRepository briefRepository;

    @Autowired
    private DocRepository docRepository;

    @Autowired
    private DocVersionRepository docVersionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    private User proUser;
    private User freeUser;
    private User otherUser;
    private Room testRoom;
    private String proUserToken;
    private String freeUserToken;
    private String validStep1Markdown;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // 1. Create PRO user
        proUser = new User("GITHUB", "gh-" + UUID.randomUUID(), "Pro Hacker", "pro-" + UUID.randomUUID() + "@example.com", null, "prohacker");
        proUser = userRepository.save(proUser);
        userPlanRepository.save(new UserPlan(proUser.getId(), "PRO", Instant.now(), "TEST"));

        // 2. Create FREE user
        freeUser = new User("GITHUB", "gh-" + UUID.randomUUID(), "Free Hacker", "free-" + UUID.randomUUID() + "@example.com", null, "freehacker");
        freeUser = userRepository.save(freeUser);
        userPlanRepository.save(new UserPlan(freeUser.getId(), "FREE", Instant.now(), "TEST"));

        // 3. Create another user who owns an unrelated room
        otherUser = new User("GITHUB", "gh-" + UUID.randomUUID(), "Other User", "other-" + UUID.randomUUID() + "@example.com", null, "otheruser");
        otherUser = userRepository.save(otherUser);

        // 4. Create Room owned by proUser
        testRoom = new Room();
        testRoom.setName("TrafficCast");
        testRoom.setJoinCode(UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase());
        testRoom.setKeyPrefix("TCP");
        testRoom.setOwnerId(proUser.getId());
        testRoom.setStage("plan");
        testRoom.setPlanStartedAt(Instant.now());
        testRoom = roomRepository.save(testRoom);

        // Add member
        RoomMember member = new RoomMember(testRoom.getId(), proUser.getId(), "LEADER");
        roomMemberRepository.save(member);

        // Brief for room
        Brief brief = new Brief(testRoom.getId(), "manual");
        brief.setProblemStatement("Urban traffic congestion requires predictive routing and real-time alerts.");
        briefRepository.save(brief);

        // Generate tokens
        var proGen = mcpTokenService.createAccessToken(proUser.getId(), Duration.ofHours(24), "test-client", "mcp");
        proUserToken = proGen.rawToken();

        var freeGen = mcpTokenService.createAccessToken(freeUser.getId(), Duration.ofHours(24), "test-client", "mcp");
        freeUserToken = freeGen.rawToken();

        // Load valid step1 fixture
        try (InputStream is = getClass().getResourceAsStream("/plan-fixtures/step1-bundle.md")) {
            assertNotNull(is, "Fixture /plan-fixtures/step1-bundle.md missing");
            validStep1Markdown = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    @Test
    @DisplayName("no token -> 401 UNAUTHORIZED")
    void testNoTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/mcp/rooms"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("expired token -> 401 UNAUTHORIZED")
    void testExpiredTokenReturns401() throws Exception {
        String rawToken = mcpTokenService.generateRawToken();
        String hash = McpTokenService.hashToken(rawToken);
        McpToken expiredToken = new McpToken(proUser.getId(), hash, "ACCESS", "test-client", "mcp", Instant.now().minusSeconds(3600));
        mcpTokenRepository.save(expiredToken);

        mockMvc.perform(get("/api/v1/mcp/rooms")
                        .header("Authorization", "Bearer " + rawToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value(containsString("expired")));
    }

    @Test
    @DisplayName("revoked token -> 401 UNAUTHORIZED")
    void testRevokedTokenReturns401() throws Exception {
        String rawToken = mcpTokenService.generateRawToken();
        String hash = McpTokenService.hashToken(rawToken);
        McpToken revokedToken = new McpToken(proUser.getId(), hash, "ACCESS", "test-client", "mcp", Instant.now().plus(Duration.ofHours(1)));
        revokedToken.setRevokedAt(Instant.now());
        mcpTokenRepository.save(revokedToken);

        mockMvc.perform(get("/api/v1/mcp/rooms")
                        .header("Authorization", "Bearer " + rawToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value(containsString("revoked")));
    }

    @Test
    @DisplayName("valid token but user not in room -> 403 NOT_A_MEMBER")
    void testValidTokenNotInRoomReturns403() throws Exception {
        // Create a room owned by otherUser without proUser as member
        Room otherRoom = new Room();
        otherRoom.setName("Secret Room");
        otherRoom.setJoinCode(UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase());
        otherRoom.setKeyPrefix("SEC");
        otherRoom.setOwnerId(otherUser.getId());
        otherRoom = roomRepository.save(otherRoom);

        mockMvc.perform(get("/api/v1/mcp/rooms/" + otherRoom.getId() + "/steps")
                        .header("Authorization", "Bearer " + proUserToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_A_MEMBER"));
    }

    @Test
    @DisplayName("FREE-plan user -> 403 MCP_REQUIRES_PRO")
    void testFreePlanUserReturns403() throws Exception {
        mockMvc.perform(get("/api/v1/mcp/rooms")
                        .header("Authorization", "Bearer " + freeUserToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("MCP_REQUIRES_PRO"))
                .andExpect(jsonPath("$.message").value(containsString("Pro or Max plan")));
    }

    @Test
    @DisplayName("GET /api/v1/mcp/rooms lists rooms where user is an active member")
    void testListRoomsSuccess() throws Exception {
        mockMvc.perform(get("/api/v1/mcp/rooms")
                        .header("Authorization", "Bearer " + proUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].id").value(testRoom.getId().toString()))
                .andExpect(jsonPath("$[0].name").value(testRoom.getName()))
                .andExpect(jsonPath("$[0].role").value("LEADER"));
    }

    @Test
    @DisplayName("GET /api/v1/mcp/rooms/{roomId}/steps returns 5 steps with expected files and status")
    void testGetStepsReturns5Steps() throws Exception {
        mockMvc.perform(get("/api/v1/mcp/rooms/" + testRoom.getId() + "/steps")
                        .header("Authorization", "Bearer " + proUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[0].key").value("prd"))
                .andExpect(jsonPath("$[0].number").value(1))
                .andExpect(jsonPath("$[0].expectedFiles", containsInAnyOrder("PRD.md", "MVP.md")))
                .andExpect(jsonPath("$[0].status").value("current"))
                .andExpect(jsonPath("$[1].key").value("tech"))
                .andExpect(jsonPath("$[1].number").value(2))
                .andExpect(jsonPath("$[2].key").value("phases"))
                .andExpect(jsonPath("$[2].number").value(3))
                .andExpect(jsonPath("$[3].key").value("tasks"))
                .andExpect(jsonPath("$[3].number").value(4))
                .andExpect(jsonPath("$[3].expectedFiles", contains("TASKS.md")))
                .andExpect(jsonPath("$[4].key").value("demo"))
                .andExpect(jsonPath("$[4].number").value(5));
    }

    @Test
    @DisplayName("brief returns non-empty prompt and context for each of the 5 steps")
    void testBriefReturnsNonEmptyPromptAndContextForAll5Steps() throws Exception {
        String[] steps = {"prd", "tech", "phases", "tasks", "demo"};

        for (String step : steps) {
            MvcResult result = mockMvc.perform(get("/api/v1/mcp/rooms/" + testRoom.getId() + "/steps/" + step + "/brief")
                            .header("Authorization", "Bearer " + proUserToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.step").value(step))
                    .andExpect(jsonPath("$.expectedFiles", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.prompt").isString())
                    .andExpect(jsonPath("$.context").isString())
                    .andExpect(jsonPath("$.webUrl").value(containsString("/plan?step=" + step)))
                    .andReturn();

            String body = result.getResponse().getContentAsString();
            var json = objectMapper.readTree(body);

            String prompt = json.get("prompt").asText();
            String context = json.get("context").asText();

            assertNotNull(prompt, "Prompt must not be null for step " + step);
            assertFalse(prompt.trim().isEmpty(), "Prompt must not be empty for step " + step);
            assertTrue(prompt.contains("=== OUTPUT DELIVERY"), "Prompt must include output delivery block for step " + step);

            assertNotNull(context, "Context must not be null for step " + step);
            assertFalse(context.trim().isEmpty(), "Context must not be empty for step " + step);
        }
    }

    @Test
    @DisplayName("submit with a valid document -> ok=true AND a new doc_versions row exists")
    void testSubmitValidDocumentCreatesDocVersion() throws Exception {
        McpSubmitRequest request = new McpSubmitRequest(validStep1Markdown, false, false);

        long beforeCount = docVersionRepository.count();

        mockMvc.perform(post("/api/v1/mcp/rooms/" + testRoom.getId() + "/steps/prd/submit")
                        .header("Authorization", "Bearer " + proUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.webUrl").value(containsString("/plan?step=prd")));

        long afterCount = docVersionRepository.count();
        assertTrue(afterCount > beforeCount, "A new doc_versions row must exist after valid submission");

        // Verify PRD.md doc exists for this room
        Doc prdDoc = docRepository.findByRoomIdAndFileName(testRoom.getId(), "PRD.md").orElse(null);
        assertNotNull(prdDoc, "PRD.md Doc row must exist");
        List<DocVersion> versions = docVersionRepository.findByDocIdOrderByVersionDesc(prdDoc.getId());
        assertFalse(versions.isEmpty(), "Doc versions for PRD.md must not be empty");
    }

    @Test
    @DisplayName("submit with an invalid document -> ok=false with a non-empty repairPrompt")
    void testSubmitInvalidDocumentReturnsRepairPrompt() throws Exception {
        String invalidText = "Hello this is completely invalid text without file blocks or headings.";
        McpSubmitRequest request = new McpSubmitRequest(invalidText, false, false);

        mockMvc.perform(post("/api/v1/mcp/rooms/" + testRoom.getId() + "/steps/prd/submit")
                        .header("Authorization", "Bearer " + proUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(false))
                .andExpect(jsonPath("$.repairPrompt").isNotEmpty())
                .andExpect(jsonPath("$.webUrl").value(containsString("/plan?step=prd")));
    }

    @Test
    @DisplayName("dev mcp-token endpoint creates 24h access token for session user and returned token works")
    void testDevMcpTokenEndpoint() throws Exception {
        var auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(proUser, null, java.util.Collections.emptyList());

        String responseBody = mockMvc.perform(post("/api/v1/dev/mcp-token")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication(auth))
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(startsWith("bkt_")))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.scope").value("mcp"))
                .andExpect(jsonPath("$.expiresAt").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        com.fasterxml.jackson.databind.JsonNode json = objectMapper.readTree(responseBody);
        String devToken = json.get("token").asText();

        // Use devToken to call MCP rooms endpoint
        mockMvc.perform(get("/api/v1/mcp/rooms")
                        .header("Authorization", "Bearer " + devToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(testRoom.getId().toString()));
    }
}
