package com.hackathonos.backend.events;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Centrally publishes real-time room events for every mutating API request after commit.
 * Enforces 150ms burst deduplication for specific topics and 2-second coalescing for "overview".
 * Uses a bounded Caffeine cache to prevent memory leaks.
 */
@Component
public class RoomChangeInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RoomChangeInterceptor.class);

    private static final Pattern ROOM_PATH_PATTERN =
            Pattern.compile("^/api/v1/(?:dev/)?rooms/([a-fA-F0-9-]+)(?:/(.*))?$");
    private static final long BURST_WINDOW_MS = 150L;
    private static final long OVERVIEW_COALESCE_WINDOW_MS = 2000L; // At most 1 overview event per room per 2 seconds

    private final RoomEventHub eventHub;
    private final CurrentUser currentUser;

    private final Cache<String, Long> lastPublishedTimes = Caffeine.newBuilder()
            .maximumSize(5000)
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build();

    public RoomChangeInterceptor(RoomEventHub eventHub, CurrentUser currentUser) {
        this.eventHub = eventHub;
        this.currentUser = currentUser;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return;
        }

        if (response.getStatus() >= 400) {
            return;
        }

        String path = request.getRequestURI();
        if (path == null || path.contains("/heartbeat") || path.endsWith("/events") || path.endsWith("/presence")) {
            return;
        }

        Matcher matcher = ROOM_PATH_PATTERN.matcher(path);
        if (matcher.find()) {
            String roomIdStr = matcher.group(1);
            UUID roomId;
            try {
                roomId = UUID.fromString(roomIdStr);
            } catch (Exception e) {
                log.debug("Invalid room UUID in request path: {}", roomIdStr);
                return;
            }

            try {
                String remainder = matcher.group(2);
                String[] segments = (remainder != null && !remainder.isBlank()) ? remainder.split("/") : new String[0];
                String firstSeg = segments.length > 0 ? segments[0].toLowerCase() : "";
                String entityId = segments.length > 1 ? segments[1] : null;

                String topic = resolveTopic(firstSeg);
                User actor = currentUser.getOptional().orElse(null);
                long now = System.currentTimeMillis();

                // 1. Publish primary topic with 150ms burst control
                String burstKey = roomId + ":" + topic + ":" + (entityId != null ? entityId : "");
                Long lastTime = lastPublishedTimes.getIfPresent(burstKey);
                if (lastTime == null || (now - lastTime) >= BURST_WINDOW_MS) {
                    lastPublishedTimes.put(burstKey, now);
                    eventHub.publish(roomId, topic, actor, entityId);
                }

                // 2. Coalesce "overview" to at most 1 event per room per 2000ms
                String overviewKey = roomId + ":overview:";
                Long lastOverview = lastPublishedTimes.getIfPresent(overviewKey);
                if (lastOverview == null || (now - lastOverview) >= OVERVIEW_COALESCE_WINDOW_MS) {
                    lastPublishedTimes.put(overviewKey, now);
                    eventHub.publish(roomId, "overview", actor, null);
                }

                // 3. For task paths, also send entity topic "task:<id>"
                if ("board".equals(topic) && entityId != null && !entityId.isBlank()) {
                    String taskTopic = "task:" + entityId;
                    String taskKey = roomId + ":" + taskTopic;
                    Long lastTask = lastPublishedTimes.getIfPresent(taskKey);
                    if (lastTask == null || (now - lastTask) >= BURST_WINDOW_MS) {
                        lastPublishedTimes.put(taskKey, now);
                        eventHub.publish(roomId, taskTopic, actor, entityId);
                    }
                }
            } catch (Exception e) {
                log.warn("Error publishing room change event for path {}: {}", path, e.getMessage(), e);
            }
        }
    }

    private String resolveTopic(String firstSeg) {
        return switch (firstSeg) {
            case "tasks", "subtasks", "acceptance", "comments", "dependencies", "board", "speed-mode" -> "board";
            case "ideas", "ideation", "ideate", "seed-ideas" -> "ideas";
            case "brief" -> "brief";
            case "plan" -> "plan";
            case "members", "invitations", "invites", "join-code", "leave", "team", "charter", "fake-members" -> "members";
            case "docs" -> "docs";
            case "mvp" -> "mvp";
            case "checkpoints" -> "checkpoints";
            case "github" -> "github";
            case "pitch", "seed-present" -> "pitch";
            case "demo" -> "demo";
            case "submission" -> "submission";
            case "mentor-links", "mentor-questions" -> "mentor";
            case "stage", "set-clock", "simulate-progress" -> "stage";
            case "apis" -> "apis";
            case "diagrams" -> "diagrams";
            case "retro" -> "retro";
            default -> "room";
        };
    }
}
