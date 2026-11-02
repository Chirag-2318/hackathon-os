package com.hackathonos.backend.ai;

import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.docs.*;
import com.hackathonos.backend.docs.dto.DocRequests;
import com.hackathonos.backend.users.User;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiTransactionIsolationTest {

    @Mock private DocRepository docRepository;
    @Mock private DocVersionRepository docVersionRepository;
    @Mock private RoomAccess roomAccess;
    @Mock private AiService aiService;

    @Test
    @DisplayName("Refactored DocService.askDocAi returns unchanged answer with AI call outside transaction")
    void testRefactoredDocServiceAskDocAiUnchanged() {
        UUID roomId = UUID.randomUUID();
        User user = new User("github", "123", "Alice", "alice@example.com", null, "alice");
        user.setId(UUID.randomUUID());

        Doc doc = new Doc(roomId, "ARCHITECTURE.md", "Architecture", 1);
        doc.setId(UUID.randomUUID());

        DocVersion version = new DocVersion(doc.getId(), 1, "# Architecture\nMicroservices with event-driven messaging.", "Initial", user.getId());

        when(aiService.chat(eq("docs.editor"), eq(roomId), eq(user.getId()), any(), any(), any(), eq(220)))
                .thenReturn("The architecture uses microservices with event-driven messaging.");
        when(aiService.getProperties()).thenReturn(new AiProperties(
                "https://api.groq.com/openai/v1",
                "",
                false,
                null,
                "llama-3.3-70b-versatile",
                null,
                null,
                true,
                45,
                2,
                4,
                10,
                true,
                "https://api.groq.com/openai/v1",
                "whisper-large-v3"
        ));

        DocService docService = new DocService(
                docRepository,
                docVersionRepository,
                null,
                null,
                roomAccess,
                null,
                null,
                null,
                aiService,
                null
        );

        DocRequests.DocAiRequest req = new DocRequests.DocAiRequest("What is the architecture?", null, null, null);
        DocRequests.DocAiResponse response = docService.askDocAi(roomId, "ARCHITECTURE.md", req, user);

        assertThat(response).isNotNull();
        assertThat(response.answer()).isEqualTo("The architecture uses microservices with event-driven messaging.");

        verify(aiService, times(1)).chat(eq("docs.editor"), eq(roomId), eq(user.getId()), any(), any(), any(), eq(220));
    }

    @Test
    @DisplayName("With pool of 2 connections and 5 concurrent slow (3s) AI calls, simple query answers in < 1s")
    void testPoolNotStarvedDuringSlowExternalCalls() throws Exception {
        String url = System.getenv().getOrDefault("SPRING_DATASOURCE_URL", "jdbc:postgresql://localhost:5432/hackathon_os?options=-c%20TimeZone=UTC");
        String username = System.getenv().getOrDefault("SPRING_DATASOURCE_USERNAME", "hackathon");
        String password = System.getenv().getOrDefault("SPRING_DATASOURCE_PASSWORD", "hackathon");

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(2);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(5000);

        try (HikariDataSource dataSource = new HikariDataSource(config)) {
            int numAiThreads = 5;
            ExecutorService executor = Executors.newFixedThreadPool(numAiThreads + 1);
            CountDownLatch allStarted = new CountDownLatch(numAiThreads);
            CountDownLatch pauseLlm = new CountDownLatch(1);
            AtomicBoolean allSuccess = new AtomicBoolean(true);

            // Launch 5 concurrent threads simulating AI-backed service methods:
            // 1) Read from DB (short connection)
            // 2) Slow external LLM call (3000ms sleep) with NO DB connection held
            // 3) Write result to DB (short connection)
            for (int i = 0; i < numAiThreads; i++) {
                executor.submit(() -> {
                    try {
                        // Phase 1: Short DB read
                        try (Connection conn = dataSource.getConnection();
                             Statement stmt = conn.createStatement();
                             ResultSet rs = stmt.executeQuery("SELECT 1")) {
                            rs.next();
                        } // connection returned to pool here!

                        allStarted.countDown();

                        // Phase 2: Slow external HTTP/AI call (connection NOT held)
                        pauseLlm.await(3, TimeUnit.SECONDS);

                        // Phase 3: Short DB write
                        try (Connection conn = dataSource.getConnection();
                             Statement stmt = conn.createStatement();
                             ResultSet rs = stmt.executeQuery("SELECT 1")) {
                            rs.next();
                        }
                    } catch (Exception e) {
                        allSuccess.set(false);
                    }
                });
            }

            // Wait until all 5 threads have read from DB and are now in the slow external AI call
            assertThat(allStarted.await(3, TimeUnit.SECONDS)).isTrue();

            // At this point, 5 threads are doing slow AI work, but pool only has 2 connections.
            // Because connections were returned after Phase 1, the simple GET endpoint query must succeed in < 1s!
            long startMs = System.currentTimeMillis();
            int resultValue;
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT 1")) {
                rs.next();
                resultValue = rs.getInt(1);
            }
            long durationMs = System.currentTimeMillis() - startMs;

            assertThat(resultValue).isEqualTo(1);
            // Assert that the simple query finished in well under 1000ms (typically < 50ms)
            assertThat(durationMs).isLessThan(1000L);

            // Release the AI threads and shutdown
            pauseLlm.countDown();
            executor.shutdown();
            assertThat(executor.awaitTermination(4, TimeUnit.SECONDS)).isTrue();
            assertThat(allSuccess.get()).isTrue();
        }
    }
}
