package com.hackathonos.backend.mcp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.billing.UserPlan;
import com.hackathonos.backend.billing.UserPlanRepository;
import com.hackathonos.backend.mcp.oauth.OAuthAuthCode;
import com.hackathonos.backend.mcp.oauth.OAuthAuthCodeRepository;
import com.hackathonos.backend.mcp.oauth.OAuthClient;
import com.hackathonos.backend.mcp.oauth.OAuthClientRepository;
import com.hackathonos.backend.mcp.oauth.dto.OAuthRegisterRequest;
import com.hackathonos.backend.mcp.oauth.dto.OAuthRegisterResponse;
import com.hackathonos.backend.mcp.oauth.dto.OAuthTokenResponse;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.DefaultCsrfToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("dev")
class OAuthServerIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserPlanRepository userPlanRepository;

    @Autowired
    private OAuthClientRepository clientRepository;

    @Autowired
    private OAuthAuthCodeRepository authCodeRepository;

    @Autowired
    private McpTokenRepository mcpTokenRepository;

    @Autowired
    private McpTokenService mcpTokenService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    private User proUser;
    private User freeUser;
    private Room testRoom;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        proUser = new User("GITHUB", "gh-pro-" + UUID.randomUUID(), "OAuth Pro", "pro-" + UUID.randomUUID() + "@example.com", null, "pro_oauth");
        proUser = userRepository.save(proUser);
        userPlanRepository.save(new UserPlan(proUser.getId(), "PRO", Instant.now(), "TEST"));

        freeUser = new User("GITHUB", "gh-free-" + UUID.randomUUID(), "OAuth Free", "free-" + UUID.randomUUID() + "@example.com", null, "free_oauth");
        freeUser = userRepository.save(freeUser);
        userPlanRepository.save(new UserPlan(freeUser.getId(), "FREE", Instant.now(), "TEST"));

        testRoom = new Room();
        testRoom.setName("OAuth Room");
        testRoom.setJoinCode(UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase());
        testRoom.setKeyPrefix("OAR");
        testRoom.setOwnerId(proUser.getId());
        testRoom.setStage("plan");
        testRoom.setPlanStartedAt(Instant.now());
        testRoom = roomRepository.save(testRoom);

        roomMemberRepository.save(new RoomMember(testRoom.getId(), proUser.getId(), "LEADER"));
    }

    private MockHttpSession createAuthenticatedSession(User user) {
        MockHttpSession session = new MockHttpSession();
        var auth = new UsernamePasswordAuthenticationToken(user, null, Collections.emptyList());
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, new SecurityContextImpl(auth));
        return session;
    }

    private static String generateCodeVerifier() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String computeCodeChallenge(String verifier) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
    }

    @Test
    @DisplayName("GET /.well-known/oauth-authorization-server returns metadata without client_id_metadata_document_supported")
    void testDiscovery() throws Exception {
        mockMvc.perform(get("/.well-known/oauth-authorization-server"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("max-age=3600")))
                .andExpect(jsonPath("$.issuer").isNotEmpty())
                .andExpect(jsonPath("$.authorization_endpoint").value(endsWith("/oauth/authorize")))
                .andExpect(jsonPath("$.token_endpoint").value(endsWith("/oauth/token")))
                .andExpect(jsonPath("$.registration_endpoint").value(endsWith("/oauth/register")))
                .andExpect(jsonPath("$.revocation_endpoint").value(endsWith("/oauth/revoke")))
                .andExpect(jsonPath("$.response_types_supported", contains("code")))
                .andExpect(jsonPath("$.grant_types_supported", containsInAnyOrder("authorization_code", "refresh_token")))
                .andExpect(jsonPath("$.code_challenge_methods_supported", contains("S256")))
                .andExpect(jsonPath("$.token_endpoint_auth_methods_supported", contains("none")))
                .andExpect(jsonPath("$.scopes_supported", containsInAnyOrder("mcp", "offline_access")))
                .andExpect(jsonPath("$.client_id_metadata_document_supported").doesNotExist());
    }

    @Test
    @DisplayName("Complete PKCE happy path: register -> authorize -> consent -> token -> MCP call -> refresh -> old refresh rejected -> reuse revokes family")
    void testPkceHappyPathAndRefreshRotation() throws Exception {
        // 1. Dynamic Client Registration (RFC 7591)
        OAuthRegisterRequest regReq = new OAuthRegisterRequest(
                "Claude Desktop",
                List.of("https://claude.ai/api/mcp/auth_callback"),
                List.of("authorization_code", "refresh_token"),
                List.of("code"),
                "none"
        );

        String regJson = mockMvc.perform(post("/oauth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.client_id").value(startsWith("bkt_client_")))
                .andExpect(jsonPath("$.client_name").value("Claude Desktop"))
                .andExpect(jsonPath("$.token_endpoint_auth_method").value("none"))
                .andReturn().getResponse().getContentAsString();

        OAuthRegisterResponse regResp = objectMapper.readValue(regJson, OAuthRegisterResponse.class);
        String clientId = regResp.clientId();

        // 2. Authorize GET request with PKCE S256 as logged-in PRO user
        String codeVerifier = generateCodeVerifier();
        String codeChallenge = computeCodeChallenge(codeVerifier);
        String state = "test-state-" + UUID.randomUUID();

        MockHttpSession session = createAuthenticatedSession(proUser);

        mockMvc.perform(get("/oauth/authorize")
                        .session(session)
                        .param("client_id", clientId)
                        .param("redirect_uri", "https://claude.ai/api/mcp/auth_callback")
                        .param("response_type", "code")
                        .param("code_challenge", codeChallenge)
                        .param("code_challenge_method", "S256")
                        .param("scope", "mcp offline_access")
                        .param("state", state))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(content().string(containsString("Claude Desktop")))
                .andExpect(content().string(containsString("claude.ai")));

        // 3. User decision ALLOW
        MvcResult decisionResult = mockMvc.perform(post("/oauth/authorize/decision")
                        .with(csrf())
                        .session(session)
                        .param("decision", "allow"))
                .andExpect(status().isFound())
                .andReturn();

        String location = decisionResult.getResponse().getHeader("Location");
        assertNotNull(location);
        URI redirectUri = URI.create(location);
        assertEquals("claude.ai", redirectUri.getHost());

        // Extract code and verify state
        Map<String, String> queryParams = parseQueryParams(redirectUri.getRawQuery());
        String code = queryParams.get("code");
        assertEquals(state, queryParams.get("state"));
        assertNotNull(code);
        assertTrue(code.startsWith("bkt_code_"));

        // 4. Token exchange (POST /oauth/token)
        String tokenResponseJson = mockMvc.perform(post("/oauth/token")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("grant_type", "authorization_code")
                        .param("code", code)
                        .param("client_id", clientId)
                        .param("redirect_uri", "https://claude.ai/api/mcp/auth_callback")
                        .param("code_verifier", codeVerifier))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("Pragma", "no-cache"))
                .andExpect(jsonPath("$.access_token").value(startsWith("bkt_")))
                .andExpect(jsonPath("$.token_type").value("Bearer"))
                .andExpect(jsonPath("$.expires_in").value(3600))
                .andExpect(jsonPath("$.refresh_token").value(startsWith("bkt_")))
                .andReturn().getResponse().getContentAsString();

        OAuthTokenResponse tokenResponse = objectMapper.readValue(tokenResponseJson, OAuthTokenResponse.class);
        String accessToken = tokenResponse.accessToken();
        String refreshToken = tokenResponse.refreshToken();

        // 5. Call /api/v1/mcp/rooms with access token
        mockMvc.perform(get("/api/v1/mcp/rooms")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(testRoom.getId().toString()));

        // 6. Refresh token
        String refreshedJson = mockMvc.perform(post("/oauth/token")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("grant_type", "refresh_token")
                        .param("refresh_token", refreshToken)
                        .param("client_id", clientId))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.access_token").value(startsWith("bkt_")))
                .andExpect(jsonPath("$.refresh_token").value(startsWith("bkt_")))
                .andReturn().getResponse().getContentAsString();

        OAuthTokenResponse refreshedToken = objectMapper.readValue(refreshedJson, OAuthTokenResponse.class);
        String newRefreshToken = refreshedToken.refreshToken();
        assertNotEquals(refreshToken, newRefreshToken);

        // 7. Old refresh token is rejected
        mockMvc.perform(post("/oauth/token")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("grant_type", "refresh_token")
                        .param("refresh_token", refreshToken)
                        .param("client_id", clientId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_grant"));

        // 8. Replay of old refresh revoked the family! The new refresh token is now also rejected!
        mockMvc.perform(post("/oauth/token")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("grant_type", "refresh_token")
                        .param("refresh_token", newRefreshToken)
                        .param("client_id", clientId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_grant"));
    }

    @Test
    @DisplayName("Wrong code_verifier returns 400 invalid_grant")
    void testWrongCodeVerifier() throws Exception {
        OAuthClient client = new OAuthClient("client-pkce", "PKCE Test", List.of("https://claude.ai/api/mcp/auth_callback"));
        clientRepository.save(client);

        String verifier = generateCodeVerifier();
        String challenge = computeCodeChallenge(verifier);

        String rawCode = "bkt_code_" + UUID.randomUUID();
        String codeHash = McpTokenService.hashToken(rawCode);
        OAuthAuthCode code = new OAuthAuthCode(codeHash, client.getClientId(), proUser.getId(),
                "https://claude.ai/api/mcp/auth_callback", challenge, "mcp", null, Instant.now().plus(Duration.ofMinutes(5)));
        authCodeRepository.save(code);

        mockMvc.perform(post("/oauth/token")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("grant_type", "authorization_code")
                        .param("code", rawCode)
                        .param("client_id", client.getClientId())
                        .param("redirect_uri", "https://claude.ai/api/mcp/auth_callback")
                        .param("code_verifier", "wrong-verifier-12345678901234567890123456789012"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_grant"))
                .andExpect(jsonPath("$.error_description").value(containsString("code_verifier")));
    }

    @Test
    @DisplayName("redirect_uri mismatch on /oauth/authorize renders error page and NEVER redirects")
    void testRedirectUriMismatchRendersErrorPage() throws Exception {
        OAuthClient client = new OAuthClient("client-redir", "Redir Test", List.of("https://claude.ai/api/mcp/auth_callback"));
        clientRepository.save(client);

        MockHttpSession session = createAuthenticatedSession(proUser);

        mockMvc.perform(get("/oauth/authorize")
                        .session(session)
                        .param("client_id", client.getClientId())
                        .param("redirect_uri", "https://attacker.com/callback")
                        .param("response_type", "code")
                        .param("code_challenge", "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
                        .param("code_challenge_method", "S256"))
                .andExpect(status().isBadRequest())
                .andExpect(header().doesNotExist("Location"))
                .andExpect(content().string(containsString("Redirect URI does not match")));
    }

    @Test
    @DisplayName("Non-allowlisted redirect_uri at registration rejected with 400 invalid_redirect_uri")
    void testNonAllowlistedRedirectUriRejectedAtRegistration() throws Exception {
        OAuthRegisterRequest regReq = new OAuthRegisterRequest(
                "Attacker Client",
                List.of("https://evil.example.com/steal"),
                List.of("authorization_code"),
                List.of("code"),
                "none"
        );

        mockMvc.perform(post("/oauth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_redirect_uri"));
    }

    @Test
    @DisplayName("Missing or plain code_challenge redirects with error=invalid_request")
    void testPlainCodeChallengeRedirectsWithError() throws Exception {
        OAuthClient client = new OAuthClient("client-challenge", "Challenge Test", List.of("https://claude.ai/api/mcp/auth_callback"));
        clientRepository.save(client);

        MockHttpSession session = createAuthenticatedSession(proUser);

        // Plain method
        mockMvc.perform(get("/oauth/authorize")
                        .session(session)
                        .param("client_id", client.getClientId())
                        .param("redirect_uri", "https://claude.ai/api/mcp/auth_callback")
                        .param("response_type", "code")
                        .param("code_challenge", "plain-text-challenge")
                        .param("code_challenge_method", "plain")
                        .param("state", "xyz"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", containsString("error=invalid_request")))
                .andExpect(header().string("Location", containsString("state=xyz")));

        // Missing code_challenge
        mockMvc.perform(get("/oauth/authorize")
                        .session(session)
                        .param("client_id", client.getClientId())
                        .param("redirect_uri", "https://claude.ai/api/mcp/auth_callback")
                        .param("response_type", "code")
                        .param("state", "xyz"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", containsString("error=invalid_request")));
    }

    @Test
    @DisplayName("Expired authorization code returns 400 invalid_grant")
    void testExpiredCode() throws Exception {
        OAuthClient client = new OAuthClient("client-exp", "Exp Test", List.of("https://claude.ai/api/mcp/auth_callback"));
        clientRepository.save(client);

        String verifier = generateCodeVerifier();
        String challenge = computeCodeChallenge(verifier);

        String rawCode = "bkt_code_" + UUID.randomUUID();
        String codeHash = McpTokenService.hashToken(rawCode);
        OAuthAuthCode code = new OAuthAuthCode(codeHash, client.getClientId(), proUser.getId(),
                "https://claude.ai/api/mcp/auth_callback", challenge, "mcp", null, Instant.now().minusSeconds(60));
        authCodeRepository.save(code);

        mockMvc.perform(post("/oauth/token")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("grant_type", "authorization_code")
                        .param("code", rawCode)
                        .param("client_id", client.getClientId())
                        .param("redirect_uri", "https://claude.ai/api/mcp/auth_callback")
                        .param("code_verifier", verifier))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_grant"))
                .andExpect(jsonPath("$.error_description").value(containsString("expired")));
    }

    @Test
    @DisplayName("Reused code revokes issued tokens and returns 400 invalid_grant")
    void testReusedCodeRevokesIssuedTokens() throws Exception {
        OAuthClient client = new OAuthClient("client-reuse", "Reuse Test", List.of("https://claude.ai/api/mcp/auth_callback"));
        clientRepository.save(client);

        String verifier = generateCodeVerifier();
        String challenge = computeCodeChallenge(verifier);

        String rawCode = "bkt_code_" + UUID.randomUUID();
        String codeHash = McpTokenService.hashToken(rawCode);
        OAuthAuthCode code = new OAuthAuthCode(codeHash, client.getClientId(), proUser.getId(),
                "https://claude.ai/api/mcp/auth_callback", challenge, "mcp", null, Instant.now().plusSeconds(300));
        authCodeRepository.save(code);

        // 1st exchange: successful
        String firstResp = mockMvc.perform(post("/oauth/token")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("grant_type", "authorization_code")
                        .param("code", rawCode)
                        .param("client_id", client.getClientId())
                        .param("redirect_uri", "https://claude.ai/api/mcp/auth_callback")
                        .param("code_verifier", verifier))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        OAuthTokenResponse tokenResp = objectMapper.readValue(firstResp, OAuthTokenResponse.class);
        String accessToken = tokenResp.accessToken();

        // Access token works
        mockMvc.perform(get("/api/v1/mcp/rooms")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        // 2nd exchange with same code: fails AND revokes issued token
        mockMvc.perform(post("/oauth/token")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("grant_type", "authorization_code")
                        .param("code", rawCode)
                        .param("client_id", client.getClientId())
                        .param("redirect_uri", "https://claude.ai/api/mcp/auth_callback")
                        .param("code_verifier", verifier))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_grant"))
                .andExpect(jsonPath("$.error_description").value(containsString("already been used")));

        // Token previously issued from that code must now be revoked!
        mockMvc.perform(get("/api/v1/mcp/rooms")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("FREE user gets upgrade page on authorize and no code is created")
    void testFreeUserGetsUpgradePage() throws Exception {
        OAuthClient client = new OAuthClient("client-free", "Free Test", List.of("https://claude.ai/api/mcp/auth_callback"));
        clientRepository.save(client);

        MockHttpSession session = createAuthenticatedSession(freeUser);

        long codeCountBefore = authCodeRepository.count();

        mockMvc.perform(get("/oauth/authorize")
                        .session(session)
                        .param("client_id", client.getClientId())
                        .param("redirect_uri", "https://claude.ai/api/mcp/auth_callback")
                        .param("response_type", "code")
                        .param("code_challenge", "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
                        .param("code_challenge_method", "S256"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Brackit MCP requires a Pro plan")))
                .andExpect(content().string(containsString("Upgrade to Pro")));

        long codeCountAfter = authCodeRepository.count();
        assertEquals(codeCountBefore, codeCountAfter, "No authorization code should be created for free user");
    }

    @Test
    @DisplayName("User decision DENY redirects with error=access_denied")
    void testDenyDecision() throws Exception {
        OAuthClient client = new OAuthClient("client-deny", "Deny Test", List.of("https://claude.ai/api/mcp/auth_callback"));
        clientRepository.save(client);

        MockHttpSession session = createAuthenticatedSession(proUser);

        mockMvc.perform(get("/oauth/authorize")
                        .session(session)
                        .param("client_id", client.getClientId())
                        .param("redirect_uri", "https://claude.ai/api/mcp/auth_callback")
                        .param("response_type", "code")
                        .param("code_challenge", "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
                        .param("code_challenge_method", "S256")
                        .param("state", "state-deny-123"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/oauth/authorize/decision")
                        .with(csrf())
                        .session(session)
                        .param("decision", "deny"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", containsString("error=access_denied")))
                .andExpect(header().string("Location", containsString("state=state-deny-123")));
    }

    @Test
    @DisplayName("/oauth/token rejects JSON body with 400 invalid_request")
    void testTokenEndpointRejectsJson() throws Exception {
        mockMvc.perform(post("/oauth/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"grant_type\":\"authorization_code\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_request"));
    }

    @Test
    @DisplayName("Loopback redirect with arbitrary port is accepted during registration and authorization")
    void testLoopbackRedirectWithArbitraryPort() throws Exception {
        OAuthRegisterRequest regReq = new OAuthRegisterRequest(
                "Claude Code CLI",
                List.of("http://localhost/callback", "http://127.0.0.1/auth"),
                List.of("authorization_code"),
                List.of("code"),
                "none"
        );

        String regJson = mockMvc.perform(post("/oauth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        OAuthRegisterResponse regResp = objectMapper.readValue(regJson, OAuthRegisterResponse.class);
        String clientId = regResp.clientId();

        MockHttpSession session = createAuthenticatedSession(proUser);

        // Authorize with arbitrary dynamic port on localhost (RFC 8252 loopback)
        mockMvc.perform(get("/oauth/authorize")
                        .session(session)
                        .param("client_id", clientId)
                        .param("redirect_uri", "http://localhost:59123/callback")
                        .param("response_type", "code")
                        .param("code_challenge", "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
                        .param("code_challenge_method", "S256"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Claude Code CLI")))
                .andExpect(content().string(containsString("localhost:59123")));
    }

    @Test
    @DisplayName("/api/v1/mcp/me works for a FREE user while /api/v1/mcp/rooms returns MCP_REQUIRES_PRO")
    void testMcpMeExemptFromPlanCheck() throws Exception {
        var freeGen = mcpTokenService.createAccessToken(freeUser.getId(), Duration.ofHours(1), "test-client", "mcp");
        String freeToken = freeGen.rawToken();

        // 1. /api/v1/mcp/me works for FREE user
        mockMvc.perform(get("/api/v1/mcp/me")
                        .header("Authorization", "Bearer " + freeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(freeUser.getId().toString()))
                .andExpect(jsonPath("$.name").value("OAuth Free"))
                .andExpect(jsonPath("$.plan").value("FREE"))
                .andExpect(jsonPath("$.mcpAllowed").value(false));

        // 2. /api/v1/mcp/rooms still blocked for FREE user
        mockMvc.perform(get("/api/v1/mcp/rooms")
                        .header("Authorization", "Bearer " + freeToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("MCP_REQUIRES_PRO"));
    }

    @Test
    @DisplayName("POST /oauth/revoke revokes token and subsequent bearer auth fails")
    void testRevokeToken() throws Exception {
        var tokenGen = mcpTokenService.createAccessToken(proUser.getId(), Duration.ofHours(1), "test-client", "mcp");
        String rawToken = tokenGen.rawToken();

        // Token works before revocation
        mockMvc.perform(get("/api/v1/mcp/rooms")
                        .header("Authorization", "Bearer " + rawToken))
                .andExpect(status().isOk());

        // Revoke token
        mockMvc.perform(post("/oauth/revoke")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("token", rawToken)
                        .param("token_type_hint", "access_token"))
                .andExpect(status().isOk());

        // Token fails after revocation
        mockMvc.perform(get("/api/v1/mcp/rooms")
                        .header("Authorization", "Bearer " + rawToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(containsString("revoked")));
    }

    private static Map<String, String> parseQueryParams(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.isBlank()) return params;
        for (String param : query.split("&")) {
            String[] pair = param.split("=", 2);
            String key = URLDecoder.decode(pair[0], StandardCharsets.UTF_8);
            String value = pair.length > 1 ? URLDecoder.decode(pair[1], StandardCharsets.UTF_8) : "";
            params.put(key, value);
        }
        return params;
    }
}
