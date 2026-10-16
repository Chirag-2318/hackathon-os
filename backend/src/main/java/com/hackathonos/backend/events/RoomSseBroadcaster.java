package com.hackathonos.backend.events;

import com.hackathonos.backend.events.dto.RoomEventDto.SsePayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * In-memory thread-safe Server-Sent Events broadcaster.
 * Manages active room emitters, heartbeat ping every 25 seconds, and a max 5 concurrent streams cap per user.
 */
@Component
public class RoomSseBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(RoomSseBroadcaster.class);
    private static final long SSE_TIMEOUT_MS = 180_000L; // 3 minutes timeout before reconnect
    private static final int MAX_STREAMS_PER_USER = 5;

    public record EmitterEntry(SseEmitter emitter, UUID userId, Instant connectedAt) {}

    private final Map<UUID, List<EmitterEntry>> roomEmitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(UUID roomId, UUID userId) {
        enforceUserStreamCap(userId);

        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        EmitterEntry entry = new EmitterEntry(emitter, userId, Instant.now());

        roomEmitters.computeIfAbsent(roomId, k -> new CopyOnWriteArrayList<>()).add(entry);

        Runnable cleanup = () -> removeEmitter(roomId, entry);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        // Send initial connected event
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("{\"status\":\"connected\",\"roomId\":\"" + roomId + "\"}"));
        } catch (IOException e) {
            cleanup.run();
        }

        return emitter;
    }

    public void broadcast(RoomEvent event) {
        if (event == null || event.getRoomId() == null) return;
        List<EmitterEntry> list = roomEmitters.get(event.getRoomId());
        if (list == null || list.isEmpty()) return;

        SsePayload payload = new SsePayload(
                event.getId(),
                event.getType(),
                event.getEntityType(),
                event.getEntityId(),
                event.getActorUserId()
        );

        for (EmitterEntry entry : list) {
            try {
                entry.emitter().send(SseEmitter.event()
                        .id(String.valueOf(event.getId()))
                        .name("room-event")
                        .data(payload));
            } catch (Exception e) {
                removeEmitter(event.getRoomId(), entry);
            }
        }
    }

    @Scheduled(fixedRate = 25_000)
    public void sendHeartbeats() {
        for (Map.Entry<UUID, List<EmitterEntry>> entry : roomEmitters.entrySet()) {
            UUID roomId = entry.getKey();
            List<EmitterEntry> list = entry.getValue();
            for (EmitterEntry e : list) {
                try {
                    e.emitter().send(SseEmitter.event()
                            .name("heartbeat")
                            .data("{\"type\":\"heartbeat\",\"time\":" + System.currentTimeMillis() + "}")
                            .comment("heartbeat:" + System.currentTimeMillis()));
                } catch (Exception ex) {
                    removeEmitter(roomId, e);
                }
            }
        }
    }

    private void removeEmitter(UUID roomId, EmitterEntry entry) {
        List<EmitterEntry> list = roomEmitters.get(roomId);
        if (list != null) {
            list.remove(entry);
            if (list.isEmpty()) {
                roomEmitters.remove(roomId);
            }
        }
        try {
            entry.emitter().complete();
        } catch (Exception ignored) {}
    }

    private void enforceUserStreamCap(UUID userId) {
        if (userId == null) return;
        List<EmitterEntry> userEntries = new ArrayList<>();
        for (List<EmitterEntry> list : roomEmitters.values()) {
            for (EmitterEntry e : list) {
                if (userId.equals(e.userId())) {
                    userEntries.add(e);
                }
            }
        }

        if (userEntries.size() >= MAX_STREAMS_PER_USER) {
            // Sort by connectedAt ascending to close oldest stream
            userEntries.sort(Comparator.comparing(EmitterEntry::connectedAt));
            int excess = userEntries.size() - MAX_STREAMS_PER_USER + 1;
            for (int i = 0; i < excess; i++) {
                EmitterEntry oldest = userEntries.get(i);
                try {
                    oldest.emitter().complete();
                } catch (Exception ignored) {}
            }
        }
    }
}
