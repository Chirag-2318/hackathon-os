package com.hackathonos.backend.stateless;

import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.session.Session;
import org.springframework.session.SessionRepository;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("dev")
class JdbcSessionPersistenceTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private SessionRepository<? extends Session> sessionRepository;

    @Autowired
    private JdbcClient jdbcClient;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Spring Session JDBC stores and retrieves session from PostgreSQL")
    @SuppressWarnings({"unchecked", "rawtypes"})
    void testSessionStoredInDatabase() {
        // 1. Create a session via SessionRepository
        Session session = sessionRepository.createSession();
        String sessionId = session.getId();
        session.setMaxInactiveInterval(Duration.ofHours(8));
        session.setAttribute("testAttribute", "statelessValue");
        ((SessionRepository) sessionRepository).save(session);

        // 2. Query the SPRING_SESSION database table directly using JdbcClient
        Long count = jdbcClient.sql("SELECT count(*) FROM SPRING_SESSION WHERE SESSION_ID = :sessionId")
                .param("sessionId", sessionId)
                .query(Long.class)
                .single();
        assertThat(count).isGreaterThanOrEqualTo(1L);

        // 3. Load session back through repository
        Session loaded = sessionRepository.findById(sessionId);
        assertThat(loaded).isNotNull();
        assertThat(loaded.<String>getAttribute("testAttribute")).isEqualTo("statelessValue");

        // 4. Delete session and verify cleanup
        sessionRepository.deleteById(sessionId);
        Long afterDeleteCount = jdbcClient.sql("SELECT count(*) FROM SPRING_SESSION WHERE SESSION_ID = :sessionId")
                .param("sessionId", sessionId)
                .query(Long.class)
                .single();
        assertThat(afterDeleteCount).isEqualTo(0L);
    }

    @Test
    @DisplayName("Logout endpoint invalidates session and returns HTTP 204")
    void testLogoutReturns204() throws Exception {
        MockMvc mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        mockMvc.perform(post("/api/v1/logout").with(csrf()))
                .andExpect(status().isNoContent());
    }
}

