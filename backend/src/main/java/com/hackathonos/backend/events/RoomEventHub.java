package com.hackathonos.backend.events;

import com.hackathonos.backend.users.User;
import jakarta.annotation.PreDestroy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Central thread-safe SSE event hub managing per-room event streams, sequence ordering,
 * ring buffers for replay, presence tracking, and user notification streams.
 */
@Component
public class RoomEventHub {

    private static final long TIMEOUT_MS = 30 * 60 * 1000L; // 30 minutes
    private static final int MAX_STREAMS_PER_USER = 3;
    private static final int RING_BUFFER_SIZE = 200;

    public record RoomEvent(
            long seq,
            String topic,
            UUID roomId,
            UUID actorId,
            String actorName,
            String entityId,
            Instant at
    ) {}

    public record UserEmitter(UUID userId, SseEmitter emitter, Instant createdAt) {}

    private final Map<UUID, List<UserEmitter>> roomEmitters = new ConcurrentHashMap<>();
    private final Map<UUID, List<SseEmitter>> notificationEmitters = new ConcurrentHashMap<>();
    private final Map<UUID, AtomicLong> roomSequences = new ConcurrentHashMap<>();
    private final Map<UUID, Deque<RoomEvent>> roomRingBuffers = new ConcurrentHashMap<>();
    private final Map<UUID, ScheduledFuture<?>> presenceDebounceMap = new ConcurrentHashMap<>();

    private final ExecutorService sseExecutor = Executors.newFixedThreadPool(4);
    private final ScheduledExecutorService scheduledExecutor = Executors.newScheduledThreadPool(2);

    /**
     * Allocates next monotonic sequence number for a room.
     */
    public long nextSeq(UUID roomId) {
        return roomSequences.computeIfAbsent(roomId, k -> new AtomicLong(0)).incrementAndGet();
    }

    /**
     * Subscribes a user to room events stream with max 3 streams per user, sequence tracking, and replay.
     */
    public SseEmitter subscribe(UUID roomId, User user, String lastEventId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        UserEmitter userEmitter = new UserEmitter(user.getId(), emitter, Instant.now());

        final boolean[] isFirstStream = {false};

        roomEmitters.compute(roomId, (k, list) -> {
            List<UserEmitter> emitters = list != null ? list : new CopyOnWriteArrayList<>();
            List<UserEmitter> userStreams = new ArrayList<>();
            for (UserEmitter ue : emitters) {
                if (ue.userId().equals(user.getId())) {
                    userStreams.add(ue);
                }
            }
            if (userStreams.isEmpty()) {
                isFirstStream[0] = true;
            }
            if (userStreams.size() >= MAX_STREAMS_PER_USER) {
                userStreams.sort(Comparator.comparing(UserEmitter::createdAt));
                UserEmitter oldest = userStreams.get(0);
                try {
                    oldest.emitter().complete();
                } catch (Exception ignored) {}
                emitters.remove(oldest);
            }
            emitters.add(userEmitter);
            return emitters;
        });

        Runnable cleanup = () -> {
            removeRoomEmitter(roomId, userEmitter);
            if (!isUserOnline(roomId, user.getId())) {
                schedulePresenceDebounce(roomId);
            }
        };

        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        // Initial connect ack
        try {
            emitter.send(SseEmitter.event().name("init").data(Map.of("connected", true, "at", Instant.now().toString())));
        } catch (IOException e) {
            emitter.complete();
            return emitter;
        }

        // Replay events from ring buffer if Last-Event-ID header is present
        if (lastEventId != null && !lastEventId.isBlank()) {
            try {
                long lastSeq = Long.parseLong(lastEventId.trim());
                replayEventsAfter(roomId, lastSeq, emitter);
            } catch (NumberFormatException ignored) {}
        }

        if (isFirstStream[0]) {
            schedulePresenceDebounce(roomId);
        }

        return emitter;
    }

    /**
     * Backward-compatible alias for subscribe.
     */
    public SseEmitter subscribeRoom(UUID roomId, User user) {
        return subscribe(roomId, user, null);
    }

    /**
     * Subscribes a user to their personal user-level notifications and room updates stream.
     */
    public SseEmitter subscribeNotifications(User user) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        notificationEmitters.compute(user.getId(), (k, list) -> {
            List<SseEmitter> emitters = list != null ? list : new CopyOnWriteArrayList<>();
            if (emitters.size() >= MAX_STREAMS_PER_USER) {
                SseEmitter oldest = emitters.get(0);
                try {
                    oldest.complete();
                } catch (Exception ignored) {}
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
     * Publishes a RoomEvent to the ring buffer and asynchronously pushes to open emitters.
     */
    public void publish(UUID roomId, RoomEvent event) {
        if (roomId == null || event == null) return;

        // Add to ring buffer
        Deque<RoomEvent> ringBuffer = roomRingBuffers.computeIfAbsent(roomId, k -> new ConcurrentLinkedDeque<>());
        synchronized (ringBuffer) {
            while (ringBuffer.size() >= RING_BUFFER_SIZE) {
                ringBuffer.pollFirst();
            }
            ringBuffer.addLast(event);
        }

        // Asynchronously broadcast to emitters
        List<UserEmitter> emitters = roomEmitters.get(roomId);
        if (emitters == null || emitters.isEmpty()) return;

        List<UserEmitter> snapshot = new ArrayList<>(emitters);
        sseExecutor.submit(() -> {
            List<UserEmitter> failed = new ArrayList<>();
            for (UserEmitter ue : snapshot) {
                try {
                    ue.emitter().send(SseEmitter.event()
                            .id(String.valueOf(event.seq()))
                            .name("room")
                            .data(event));
                } catch (Exception e) {
                    failed.add(ue);
                }
            }
            for (UserEmitter ue : failed) {
                removeRoomEmitter(roomId, ue);
            }
        });
    }

    /**
     * Constructs and publishes a new event for a room.
     */
    public void publish(UUID roomId, String topic, User actor, String entityId) {
        long seq = nextSeq(roomId);
        RoomEvent event = new RoomEvent(
                seq,
                topic != null ? topic : "room",
                roomId,
                actor != null ? actor.getId() : null,
                actor != null ? actor.getName() : "System",
                entityId,
                Instant.now()
        );
        publish(roomId, event);
    }

    /**
     * Backward-compatible publishing with topic string.
     */
    public void publish(UUID roomId, String eventType) {
        publish(roomId, eventType, null, null);
    }

    /**
     * Publishes user-level room update event.
     */
    public void publishUser(UUID userId, String topic) {
        if (userId == null) return;
        List<SseEmitter> emitters = notificationEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) return;

        List<SseEmitter> snapshot = new ArrayList<>(emitters);
        Map<String, Object> data = Map.of(
                "topic", topic != null ? topic : "rooms",
                "at", Instant.now().toString()
        );

        sseExecutor.submit(() -> {
            List<SseEmitter> failed = new ArrayList<>();
            for (SseEmitter emitter : snapshot) {
                try {
                    emitter.send(SseEmitter.event().name("user").data(data));
                } catch (Exception e) {
                    failed.add(emitter);
                }
            }
            for (SseEmitter emitter : failed) {
                removeNotificationEmitter(userId, emitter);
            }
        });
    }

    /**
     * Sends a notification event to a specific user on user stream.
     */
    public void publishNotification(UUID userId) {
        if (userId == null) return;
        List<SseEmitter> emitters = notificationEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) return;

        List<SseEmitter> snapshot = new ArrayList<>(emitters);
        Map<String, Object> data = Map.of(
                "topic", "notification",
                "type", "notification",
                "at", Instant.now().toString()
        );

        sseExecutor.submit(() -> {
            List<SseEmitter> failed = new ArrayList<>();
            for (SseEmitter emitter : snapshot) {
                try {
                    emitter.send(SseEmitter.event().name("user").data(data));
                    emitter.send(SseEmitter.event().name("notification").data(data));
                } catch (Exception e) {
                    failed.add(emitter);
                }
            }
            for (SseEmitter emitter : failed) {
                removeNotificationEmitter(userId, emitter);
            }
        });
    }

    /**
     * Returns online user IDs with active SSE connections in the room.
     */
    public Set<UUID> onlineUserIds(UUID roomId) {
        List<UserEmitter> emitters = roomEmitters.get(roomId);
        if (emitters == null || emitters.isEmpty()) return Collections.emptySet();
        Set<UUID> ids = new HashSet<>();
        for (UserEmitter ue : emitters) {
            ids.add(ue.userId());
        }
        return ids;
    }

    /**
     * Checks if a user is online in a specific room.
     */
    public boolean isUserOnline(UUID roomId, UUID userId) {
        if (roomId == null || userId == null) return false;
        List<UserEmitter> emitters = roomEmitters.get(roomId);
        if (emitters == null || emitters.isEmpty()) return false;
        for (UserEmitter ue : emitters) {
            if (ue.userId().equals(userId)) return true;
        }
        return false;
    }

    /**
     * Checks if a user has an active connection anywhere.
     */
    public boolean isUserOnlineAnywhere(UUID userId) {
        if (userId == null) return false;
        for (List<UserEmitter> list : roomEmitters.values()) {
            for (UserEmitter ue : list) {
                if (ue.userId().equals(userId)) return true;
            }
        }
        List<SseEmitter> notifs = notificationEmitters.get(userId);
        return notifs != null && !notifs.isEmpty();
    }

    /**
     * Debounces presence event broadcast by 2 seconds to avoid reconnection flicker.
     */
    private void schedulePresenceDebounce(UUID roomId) {
        presenceDebounceMap.compute(roomId, (k, existing) -> {
            if (existing != null && !existing.isDone()) {
                existing.cancel(false);
            }
            return scheduledExecutor.schedule(() -> {
                publish(roomId, "presence", null, null);
            }, 2, TimeUnit.SECONDS);
        });
    }

    /**
     * Replays missed events from ring buffer or emits a resync event.
     */
    private void replayEventsAfter(UUID roomId, long lastSeq, SseEmitter targetEmitter) {
        Deque<RoomEvent> ringBuffer = roomRingBuffers.get(roomId);
        if (ringBuffer == null) return;

        List<RoomEvent> toSend = new ArrayList<>();
        boolean needsResync = false;

        synchronized (ringBuffer) {
            if (ringBuffer.isEmpty()) return;
            long oldestSeq = ringBuffer.peekFirst().seq();
            if (lastSeq < oldestSeq) {
                needsResync = true;
            } else {
                for (RoomEvent ev : ringBuffer) {
                    if (ev.seq() > lastSeq) {
                        toSend.add(ev);
                    }
                }
            }
        }

        if (needsResync) {
            long seq = nextSeq(roomId);
            RoomEvent resync = new RoomEvent(seq, "resync", roomId, null, "System", null, Instant.now());
            try {
                targetEmitter.send(SseEmitter.event().id(String.valueOf(seq)).name("room").data(resync));
            } catch (Exception ignored) {}
        } else {
            for (RoomEvent ev : toSend) {
                try {
                    targetEmitter.send(SseEmitter.event().id(String.valueOf(ev.seq())).name("room").data(ev));
                } catch (Exception ignored) {
                    break;
                }
            }
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
        sseExecutor.shutdown();
        scheduledExecutor.shutdown();
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
