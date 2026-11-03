package com.hackathonos.backend.stateless;

import com.hackathonos.backend.common.security.OAuth2LoginSuccessHandler;
import com.hackathonos.backend.users.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.session.web.http.SessionRepositoryFilter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("dev")
class OAuth2LoginSessionPersistenceIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Autowired
    private SessionRepositoryFilter<?> sessionRepositoryFilter;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcClient jdbcClient;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(sessionRepositoryFilter)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("Simulated GitHub OAuth2 login callback persists session in PostgreSQL and subsequent GET /api/v1/me returns 200")
    void testGithubOAuth2LoginSessionPersistence() throws Exception {
        Map<String, Object> attributes = Map.of(
                "id", 888801,
                "login", "test-github-user",
                "name", "Test GitHub User",
                "email", "github-user-888801@example.com",
                "avatar_url", "https://github.com/avatar888801.png"
        );
        OAuth2User oauth2User = new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "login"
        );
        OAuth2AuthenticationToken authToken = new OAuth2AuthenticationToken(
                oauth2User,
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                "github"
        );

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/login/oauth2/code/github");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Run through sessionRepositoryFilter so the request is wrapped by Spring Session JDBC
        sessionRepositoryFilter.doFilter(request, response, (req, res) -> {
            try {
                oAuth2LoginSuccessHandler.onAuthenticationSuccess((HttpServletRequest) req, (HttpServletResponse) res, authToken);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        assertThat(response.getRedirectedUrl()).endsWith("/app");

        // Extract JSESSIONID cookie returned by callback response
        Cookie sessionCookie = response.getCookie("JSESSIONID");
        String cookieValue;
        if (sessionCookie != null) {
            cookieValue = sessionCookie.getValue();
        } else {
            String setCookie = response.getHeader("Set-Cookie");
            assertThat(setCookie).as("Set-Cookie header or cookie should be present").isNotNull();
            cookieValue = setCookie.split(";")[0].split("=")[1];
        }
        assertThat(cookieValue).isNotBlank();

        // Verify session and security context attribute exist in PostgreSQL tables
        Long sessionCount = jdbcClient.sql("SELECT count(*) FROM SPRING_SESSION WHERE SESSION_ID = :sessionId")
                .param("sessionId", cookieValue)
                .query(Long.class)
                .single();
        assertThat(sessionCount).isGreaterThanOrEqualTo(1L);

        Long attrCount = jdbcClient.sql("SELECT count(*) FROM SPRING_SESSION_ATTRIBUTES a JOIN SPRING_SESSION s ON a.SESSION_PRIMARY_ID = s.PRIMARY_ID WHERE s.SESSION_ID = :sessionId AND a.ATTRIBUTE_NAME = 'SPRING_SECURITY_CONTEXT'")
                .param("sessionId", cookieValue)
                .query(Long.class)
                .single();
        assertThat(attrCount).isGreaterThanOrEqualTo(1L);

        // Call GET /api/v1/me using ONLY the cookies returned by the callback response
        Cookie cookie = new Cookie("JSESSIONID", cookieValue);
        mockMvc.perform(get("/api/v1/me").cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("github-user-888801@example.com"));
    }

    @Test
    @DisplayName("Simulated Google OAuth2 login callback persists session in PostgreSQL and subsequent GET /api/v1/me returns 200")
    void testGoogleOAuth2LoginSessionPersistence() throws Exception {
        Map<String, Object> attributes = Map.of(
                "sub", "google-sub-999902",
                "name", "Google Test User",
                "email", "google-user-999902@example.com",
                "picture", "https://avatar.google.com/999902.png"
        );
        OAuth2User oauth2User = new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "sub"
        );
        OAuth2AuthenticationToken authToken = new OAuth2AuthenticationToken(
                oauth2User,
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                "google"
        );

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/login/oauth2/code/google");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Run through sessionRepositoryFilter so the request is wrapped by Spring Session JDBC
        sessionRepositoryFilter.doFilter(request, response, (req, res) -> {
            try {
                oAuth2LoginSuccessHandler.onAuthenticationSuccess((HttpServletRequest) req, (HttpServletResponse) res, authToken);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        assertThat(response.getRedirectedUrl()).endsWith("/app");

        // Extract JSESSIONID cookie returned by callback response
        Cookie sessionCookie = response.getCookie("JSESSIONID");
        String cookieValue;
        if (sessionCookie != null) {
            cookieValue = sessionCookie.getValue();
        } else {
            String setCookie = response.getHeader("Set-Cookie");
            assertThat(setCookie).as("Set-Cookie header or cookie should be present").isNotNull();
            cookieValue = setCookie.split(";")[0].split("=")[1];
        }
        assertThat(cookieValue).isNotBlank();

        // Verify session and security context attribute exist in PostgreSQL tables
        Long sessionCount = jdbcClient.sql("SELECT count(*) FROM SPRING_SESSION WHERE SESSION_ID = :sessionId")
                .param("sessionId", cookieValue)
                .query(Long.class)
                .single();
        assertThat(sessionCount).isGreaterThanOrEqualTo(1L);

        Long attrCount = jdbcClient.sql("SELECT count(*) FROM SPRING_SESSION_ATTRIBUTES a JOIN SPRING_SESSION s ON a.SESSION_PRIMARY_ID = s.PRIMARY_ID WHERE s.SESSION_ID = :sessionId AND a.ATTRIBUTE_NAME = 'SPRING_SECURITY_CONTEXT'")
                .param("sessionId", cookieValue)
                .query(Long.class)
                .single();
        assertThat(attrCount).isGreaterThanOrEqualTo(1L);

        // Call GET /api/v1/me using ONLY the cookies returned by the callback response
        Cookie cookie = new Cookie("JSESSIONID", cookieValue);
        mockMvc.perform(get("/api/v1/me").cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("google-user-999902@example.com"));
    }

    @Test
    @DisplayName("GET /api/v1/public/config returns 200 and public configuration")
    void testPublicConfigEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/public/config"))
                .andExpect(status().isOk());
    }
}
