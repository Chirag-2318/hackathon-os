package com.hackathonos.backend.loadtest;

import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/loadtest")
@Profile("loadtest")
public class LoadtestController {

    private static final Logger log = LoggerFactory.getLogger(LoadtestController.class);

    private final LoadtestSeedService seedService;
    private final UserRepository userRepository;

    public LoadtestController(LoadtestSeedService seedService, UserRepository userRepository) {
        this.seedService = seedService;
        this.userRepository = userRepository;
    }

    public record SeedRequest(Integer userCount, Integer roomCount, Integer tasksPerRoom, Integer docsPerRoom, Integer ideasPerRoom) {}

    @PostMapping("/seed")
    public ResponseEntity<LoadtestSeedService.SeedResponse> seed(@RequestBody(required = false) SeedRequest request) {
        int users = request != null && request.userCount() != null ? request.userCount() : 100;
        int rooms = request != null && request.roomCount() != null ? request.roomCount() : Math.max(1, users / 5);
        int tasks = request != null && request.tasksPerRoom() != null ? request.tasksPerRoom() : 15;
        int docs = request != null && request.docsPerRoom() != null ? request.docsPerRoom() : 5;
        int ideas = request != null && request.ideasPerRoom() != null ? request.ideasPerRoom() : 10;

        LoadtestSeedService.SeedResponse response = seedService.seed(users, rooms, tasks, docs, ideas);
        return ResponseEntity.ok(response);
    }

    public record SessionRequest(String email) {}
    public record SessionResponse(String email, UUID userId, String sessionId, String csrfToken) {}

    @PostMapping("/session")
    public ResponseEntity<?> createSession(@RequestBody SessionRequest request) {
        if (request == null || request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        User user = userRepository.findByEmailIgnoreCase(request.email().trim()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        String sessionId = seedService.createAuthenticatedSession(user);
        String csrfToken = UUID.randomUUID().toString();
        return ResponseEntity.ok(new SessionResponse(user.getEmail(), user.getId(), sessionId, csrfToken));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        long userCount = userRepository.count();
        return ResponseEntity.ok(Map.of(
                "profile", "loadtest",
                "ready", true,
                "userCount", userCount,
                "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * In-process mock AI chat completions endpoint for load tests without external containers.
     * Simulates 15-40s random latency (or header X-Mock-Delay-Ms).
     */
    @PostMapping(value = {"/mock-ai/chat/completions", "/mock-ai/v1/chat/completions"})
    public ResponseEntity<Map<String, Object>> mockChatCompletions(
            @RequestBody(required = false) Map<String, Object> body,
            HttpServletRequest request
    ) {
        long delayMs = resolveDelayMs(request);
        simulateLatency(delayMs);

        Map<String, Object> message = Map.of(
                "role", "assistant",
                "content", "{\"title\":\"Synthetic AI Load Test Plan\",\"summary\":\"Generated under simulated delay\",\"tasks\":[{\"title\":\"Test task\",\"description\":\"Simulated task\"}]}"
        );

        Map<String, Object> choice = Map.of(
                "index", 0,
                "message", message,
                "finish_reason", "stop"
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", "chatcmpl-loadtest-" + UUID.randomUUID());
        response.put("object", "chat.completion");
        response.put("created", System.currentTimeMillis() / 1000);
        response.put("model", "llama-3.3-70b-versatile");
        response.put("choices", List.of(choice));
        response.put("usage", Map.of("prompt_tokens", 100, "completion_tokens", 50, "total_tokens", 150));

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = {"/mock-ai/audio/transcriptions", "/mock-ai/v1/audio/transcriptions"})
    public ResponseEntity<Map<String, Object>> mockTranscriptions(HttpServletRequest request) {
        long delayMs = resolveDelayMs(request);
        simulateLatency(delayMs);

        return ResponseEntity.ok(Map.of("text", "Simulated speech transcription output for load test."));
    }

    private long resolveDelayMs(HttpServletRequest request) {
        String headerDelay = request.getHeader("X-Mock-Delay-Ms");
        if (headerDelay != null && !headerDelay.isBlank()) {
            try {
                return Long.parseLong(headerDelay.trim());
            } catch (NumberFormatException ignored) {}
        }
        // Default random latency 15 to 40 seconds (or 500ms if fast mode specified in query)
        String fast = request.getParameter("fast");
        if ("true".equalsIgnoreCase(fast)) {
            return 500L;
        }
        return 15000L + (long) (Math.random() * 25000L);
    }

    private void simulateLatency(long delayMs) {
        if (delayMs <= 0) return;
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

