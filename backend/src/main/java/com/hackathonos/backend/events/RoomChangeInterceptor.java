package com.hackathonos.backend.events;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Centrally publishes real-time room events for every mutating API request after commit.
 * Enforces 150ms burst deduplication and topic mapping.
 */
@Component
public class RoomChangeInterceptor implements HandlerInterceptor {

    private static final Pattern ROOM_PATH_PATTERN =
            Pattern.compile("^/api/v1/(?:dev/)?rooms/([a-fA-F0-9-]+)(?:/(.*))?$");
    private static final long BURST_WINDOW_MS = 150L;

    private final RoomEventHub eventHub;
    private final CurrentUser currentUser;
    private final Map<String, Long> lastPublishedTimes = new ConcurrentHashMap<>();

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
            } catch (Exception ignored) {
                return;
            }

            String remainder = matcher.group(2);
            String[] segments = (remainder != null && !remainder.isBlank()) ? remainder.split("/") : new String[0];
            String firstSeg = segments.length > 0 ? segments[0].toLowerCase() : "";
            String entityId = segments.length > 1 ? segments[1] : null;

            String topic = resolveTopic(firstSeg);
            User actor = currentUser.getOptional().orElse(null);
            long now = System.currentTimeMillis();

            // 1. Publish primary topic with burst control
            String burstKey = roomId + ":" + topic + ":" + (entityId != null ? entityId : "");
            Long lastTime = lastPublishedTimes.get(burstKey);
            if (lastTime == null || (now - lastTime) >= BURST_WINDOW_MS) {
                lastPublishedTimes.put(burstKey, now);
                eventHub.publish(roomId, topic, actor, entityId);
            }

            // 2. Always ALSO publish "overview"
            String overviewKey = roomId + ":overview:";
            Long lastOverview = lastPublishedTimes.get(overviewKey);
            if (lastOverview == null || (now - lastOverview) >= BURST_WINDOW_MS) {
                lastPublishedTimes.put(overviewKey, now);
                eventHub.publish(roomId, "overview", actor, null);
            }

            // 3. For task paths, also send entity topic "task:<id>"
            if ("board".equals(topic) && entityId != null && !entityId.isBlank()) {
                String taskTopic = "task:" + entityId;
                String taskKey = roomId + ":" + taskTopic;
                Long lastTask = lastPublishedTimes.get(taskKey);
                if (lastTask == null || (now - lastTask) >= BURST_WINDOW_MS) {
                    lastPublishedTimes.put(taskKey, now);
                    eventHub.publish(roomId, taskTopic, actor, entityId);
                }
            }

            // Cleanup map if it grows large
            if (lastPublishedTimes.size() > 5000) {
                lastPublishedTimes.entrySet().removeIf(e -> (now - e.getValue()) > 10000);
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
