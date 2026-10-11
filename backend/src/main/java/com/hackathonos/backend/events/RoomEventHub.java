package com.hackathonos.backend.events;

import com.hackathonos.backend.users.User;
import jakarta.annotation.PreDestroy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class RoomEventHub {

    private static final long TIMEOUT_MS = 30 * 60 * 1000L; // 30 minutes
    private static final int MAX_STREAMS_PER_USER = 3;

    public record UserEmitter(UUID userId, SseEmitter emitter, Instant createdAt) {}

    private final Map<UUID, List<UserEmitter>> roomEmitters = new ConcurrentHashMap<>();
    private final Map<UUID, List<SseEmitter>> notificationEmitters = new ConcurrentHashMap<>();

    /**
     * Subscribes a user to room events stream with max 3 concurrent streams per user per room.
     */
    public SseEmitter subscribeRoom(UUID roomId, User user) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        UserEmitter userEmitter = new UserEmitter(user.getId(), emitter, Instant.now());

        roomEmitters.compute(roomId, (k, list) -> {
            List<UserEmitter> emitters = list != null ? list : new CopyOnWriteArrayList<>();
            List<UserEmitter> userStreams = new ArrayList<>();
            for (UserEmitter ue : emitters) {
                if (ue.userId().equals(user.getId())) {
                    userStreams.add(ue);
                }
            }
            if (userStreams.size() >= MAX_STREAMS_PER_USER) {
                userStreams.sort(Comparator.comparing(UserEmitter::createdAt));
                UserEmitter oldest = userStreams.get(0);
                oldest.emitter().complete();
                emitters.remove(oldest);
            }
            emitters.add(userEmitter);
            return emitters;
        });

        Runnable cleanup = () -> removeRoomEmitter(roomId, userEmitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        try {
            emitter.send(SseEmitter.event().name("init").data(Map.of("connected", true, "at", Instant.now().toString())));
        } catch (IOException e) {
            emitter.complete();
        }

        return emitter;
    }

    /**
     * Subscribes a user to their personal notifications stream.
     */
    public SseEmitter subscribeNotifications(User user) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        notificationEmitters.compute(user.getId(), (k, list) -> {
            List<SseEmitter> emitters = list != null ? list : new CopyOnWriteArrayList<>();
            if (emitters.size() >= MAX_STREAMS_PER_USER) {
                SseEmitter oldest = emitters.get(0);
                oldest.complete();
                emitters.remove(oldest);
            }
            emitters.add(emitter);
            return emitters;
        });

        Runnable cleanup = () -> removeNotificationEmitter(user.getId(), emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        try {
            emitter.send(SseEmitter.event().name("init").data(Map.of("connected", true, "at", Instant.now().toString())));
        } catch (IOException e) {
            emitter.complete();
        }

        return emitter;
    }

    /**
     * Broadcasts an event to all connected emitters in a room.
     */
    public void publish(UUID roomId, String eventType) {
        List<UserEmitter> emitters = roomEmitters.get(roomId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        Map<String, String> payload = Map.of(
                "type", eventType,
                "at", Instant.now().toString()
        );

        List<UserEmitter> failed = new ArrayList<>();
        for (UserEmitter ue : emitters) {
            try {
                ue.emitter().send(SseEmitter.event().name(eventType).data(payload));
            } catch (Exception e) {
                failed.add(ue);
            }
        }
        for (UserEmitter ue : failed) {
            removeRoomEmitter(roomId, ue);
        }
    }

    /**
     * Sends a notification event to a specific user.
     */
    public void publishNotification(UUID userId) {
        List<SseEmitter> emitters = notificationEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) return;

        Map<String, String> payload = Map.of(
                "type", "notification",
                "at", Instant.now().toString()
        );

        List<SseEmitter> failed = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(payload));
            } catch (Exception e) {
                failed.add(emitter);
            }
        }
        for (SseEmitter emitter : failed) {
            removeNotificationEmitter(userId, emitter);
        }
    }

    /**
     * Sends keep-alive ping comment every 25 seconds.
     */
    @Scheduled(fixedDelay = 25000)
    public void pingAll() {
        for (Map.Entry<UUID, List<UserEmitter>> entry : roomEmitters.entrySet()) {
            List<UserEmitter> failed = new ArrayList<>();
            for (UserEmitter ue : entry.getValue()) {
                try {
                    ue.emitter().send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    failed.add(ue);
                }
            }
            for (UserEmitter ue : failed) {
                removeRoomEmitter(entry.getKey(), ue);
            }
        }

        for (Map.Entry<UUID, List<SseEmitter>> entry : notificationEmitters.entrySet()) {
            List<SseEmitter> failed = new ArrayList<>();
            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    failed.add(emitter);
                }
            }
            for (SseEmitter emitter : failed) {
                removeNotificationEmitter(entry.getKey(), emitter);
            }
        }
    }

    /**
     * Closes all active connections gracefully on application shutdown.
     */
    @PreDestroy
    public void shutdown() {
        for (List<UserEmitter> list : roomEmitters.values()) {
            for (UserEmitter ue : list) {
                try { ue.emitter().complete(); } catch (Exception ignored) {}
            }
        }
        roomEmitters.clear();
        for (List<SseEmitter> list : notificationEmitters.values()) {
            for (SseEmitter emitter : list) {
                try { emitter.complete(); } catch (Exception ignored) {}
            }
        }
        notificationEmitters.clear();
    }

    private void removeRoomEmitter(UUID roomId, UserEmitter userEmitter) {
        List<UserEmitter> list = roomEmitters.get(roomId);
        if (list != null) {
            list.remove(userEmitter);
            if (list.isEmpty()) {
                roomEmitters.remove(roomId);
            }
        }
    }

    private void removeNotificationEmitter(UUID userId, SseEmitter emitter) {
        List<SseEmitter> list = notificationEmitters.get(userId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                notificationEmitters.remove(userId);
            }
        }
    }
}
