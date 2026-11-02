package com.hackathonos.backend.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.rooms.dto.CreateRoomRequest;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class SecurityChainTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private User testUser;
    private MockHttpSession session;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        testUser = userRepository.save(new User(
                "GITHUB", "gh-sec-test-" + UUID.randomUUID(), "Security Tester", "sec@example.com", "https://avatar.url/sec", "sectest"
        ));

        OAuth2User oauthUser = new DefaultOAuth2User(
                List.of(),
                Map.of("id", testUser.getProviderUserId(), "login", "sectest", "name", "Security Tester", "email", "sec@example.com"),
                "login"
        );
        OAuth2AuthenticationToken authToken = new OAuth2AuthenticationToken(oauthUser, List.of(), "github");
        SecurityContextImpl securityContext = new SecurityContextImpl(authToken);

        session = new MockHttpSession();
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);
    }

    @Test
    @DisplayName("Unauthenticated request to room endpoint returns 401 UNAUTHORIZED")
    void testUnauthenticatedGets401() throws Exception {
        mockMvc.perform(get("/api/v1/rooms/" + UUID.randomUUID()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("POST to room endpoint without CSRF returns 403 FORBIDDEN")
    void testCsrfEnforcedOnPost() throws Exception {
        CreateRoomRequest request = new CreateRoomRequest(
                "CSRF Test Room", "desc", "project", "online-48h", null, "UTC"
        );

        mockMvc.perform(post("/api/v1/rooms")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Authenticated request with CSRF token to room endpoint succeeds")
    void testAuthenticatedWithCsrfSucceeds() throws Exception {
        CreateRoomRequest request = new CreateRoomRequest(
                "Auth CSRF Test Room", "desc", "project", "online-48h", null, "UTC"
        );

        mockMvc.perform(post("/api/v1/rooms")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Auth CSRF Test Room"))
                .andExpect(jsonPath("$.id").isNotEmpty());
    }
}
