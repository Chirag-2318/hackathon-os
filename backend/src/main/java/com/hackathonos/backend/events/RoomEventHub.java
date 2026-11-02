package com.hackathonos.backend.events;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.events.bus.EventBus;
import com.hackathonos.backend.presence.PresenceService;
import com.hackathonos.backend.users.User;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Hardened SSE event hub managing real-time room and user notification streams.
 * Dispatches via virtual threads, protects emitters with concurrency locks and lag thresholds,
 * persists durable events to PostgreSQL with global monotonic BIGSERIAL IDs,
 * replays missed events or emits 'resync', and connects to local or multi-instance event buses.
 */
@Component
public class RoomEventHub {

    private static final Logger log = LoggerFactory.getLogger(RoomEventHub.class);
    private static final long SSE_TIMEOUT_MS = 30 * 60 * 1000L; // 30 minutes
    private static final int RING_BUFFER_SIZE = 200;
    private static final int MAX_LAGGING_WRITES = 50;

    public record RoomEvent(
            long seq,
            String topic,
            UUID roomId,
            UUID actorId,
            String actorName,
            String entityId,
            Instant at
    ) {}

    public static class UserEmitter {
        private final UUID userId;
        private final SseEmitter emitter;
        private final Instant createdAt;
        private final Object writeLock = new Object();
        private final AtomicInteger pendingWrites = new AtomicInteger(0);

        public UserEmitter(UUID userId, SseEmitter emitter, Instant createdAt) {
            this.userId = userId;
            this.emitter = emitter;
            this.createdAt = createdAt;
        }

        public UUID userId() { return userId; }
        public SseEmitter emitter() { return emitter; }
        public Instant createdAt() { return createdAt; }

        public boolean trySend(SseEmitter.SseEventBuilder builder) {
            if (pendingWrites.incrementAndGet() > MAX_LAGGING_WRITES) {
                pendingWrites.decrementAndGet();
                return false; // Lagging beyond threshold -> drop slow client
            }
            try {
                synchronized (writeLock) {
                    emitter.send(builder);
                    return true;
                }
            } catch (Exception e) {
                return false;
            } finally {
                pendingWrites.decrementAndGet();
            }
        }
    }

    private final Map<UUID, List<UserEmitter>> roomEmitters = new ConcurrentHashMap<>();
    private final Map<UUID, List<UserEmitter>> notificationEmitters = new ConcurrentHashMap<>();

    private final Cache<UUID, Deque<RoomEvent>> roomRingBuffers = Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterAccess(1, TimeUnit.HOURS)
            .build();

    private final Cache<UUID, AtomicLong> fallbackSequences = Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterAccess(1, TimeUnit.HOURS)
            .build();

    private final Cache<UUID, ScheduledFuture<?>> presenceDebounceMap = Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterAccess(10, TimeUnit.MINUTES)
            .build();

    private final ExecutorService sseExecutor = Executors.newVirtualThreadPerTaskExecutor();
    private final ScheduledExecutorService scheduledExecutor = Executors.newScheduledThreadPool(2);

    private final AppProperties appProperties;
    private EventBus eventBus;
    private final RoomEventRepository eventRepository;
    private final PresenceService presenceService;
    private final TransactionTemplate transactionTemplate;

    public void setEventBus(EventBus eventBus) {
        this.eventBus = eventBus;
    }

    public RoomEventHub(AppProperties appProperties,
                        @Lazy EventBus eventBus,
                        RoomEventRepository eventRepository,
                        PresenceService presenceService,
                        TransactionTemplate transactionTemplate) {
        this.appProperties = appProperties;
        this.eventBus = eventBus;
        this.eventRepository = eventRepository;
        this.presenceService = presenceService;
        this.transactionTemplate = transactionTemplate;
    }

    private int getMaxStreamsPerUser() {
        return Math.max(1, appProperties.getEvents().getMaxStreamsPerUser());
    }

    public long nextSeq(UUID roomId) {
        return fallbackSequences.asMap().computeIfAbsent(roomId, k -> new AtomicLong(0)).incrementAndGet();
    }

    /**
     * Subscribes a user to room events stream with configurable stream caps, lag protection, and replay.
     */
    public SseEmitter subscribe(UUID roomId, User user, String lastEventId) {
        return subscribe(roomId, user, lastEventId, new SseEmitter(SSE_TIMEOUT_MS));
    }

    public SseEmitter subscribe(UUID roomId, User user, String lastEventId, SseEmitter emitter) {
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
            int cap = getMaxStreamsPerUser();
            if (userStreams.size() >= cap) {
                userStreams.sort(Comparator.comparing(UserEmitter::createdAt));
                UserEmitter oldest = userStreams.get(0);
                try {
                    oldest.trySend(SseEmitter.event()
                            .name("bye")
                            .data(Map.of("reason", "evicted", "message", "Stream cap exceeded")));
                } catch (Exception e) {
                    log.debug("Could not send bye event to evicted client: {}", e.getMessage());
                }
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
        emitter.onError(e -> {
            if (isExpectedDisconnect(e)) {
                log.debug("SSE client disconnected: roomId={}, userId={}, error={}", roomId, user.getId(), e.getMessage());
            } else {
                log.warn("SSE error on client: roomId={}, userId={}, error={}", roomId, user.getId(), e.getMessage());
            }
            cleanup.run();
        });

        // Send initial connect ack with retry hint and comment
        try {
            boolean sent = userEmitter.trySend(SseEmitter.event()
                    .reconnectTime(3000L)
                    .comment("connected")
                    .name("init")
                    .data(Map.of("connected", true, "at", Instant.now().toString())));
            if (!sent) {
                emitter.complete();
                return emitter;
            }
        } catch (Exception e) {
            emitter.complete();
            return emitter;
        }

        // Replay events if Last-Event-ID header/param is present
        if (lastEventId != null && !lastEventId.isBlank()) {
            try {
                long lastSeq = Long.parseLong(lastEventId.trim());
                replayEventsAfter(roomId, lastSeq, userEmitter);
            } catch (NumberFormatException ignored) {}
        }

        if (isFirstStream[0]) {
            schedulePresenceDebounce(roomId);
        }

        return emitter;
    }

    public SseEmitter subscribeRoom(UUID roomId, User user) {
        return subscribe(roomId, user, null);
    }

    /**
     * Subscribes a user to their personal notification stream.
     */
    public SseEmitter subscribeNotifications(User user) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        UserEmitter userEmitter = new UserEmitter(user.getId(), emitter, Instant.now());

        notificationEmitters.compute(user.getId(), (k, list) -> {
            List<UserEmitter> emitters = list != null ? list : new CopyOnWriteArrayList<>();
            int cap = getMaxStreamsPerUser();
            if (emitters.size() >= cap) {
                UserEmitter oldest = emitters.get(0);
                try {
                    oldest.trySend(SseEmitter.event().name("bye").data(Map.of("reason", "evicted")));
                } catch (Exception ignored) {}
                try {
                    oldest.emitter().complete();
                } catch (Exception ignored) {}
                emitters.remove(oldest);
            }
            emitters.add(userEmitter);
            return emitters;
        });

        Runnable cleanup = () -> removeNotificationEmitter(user.getId(), userEmitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> {
            if (!isExpectedDisconnect(e)) {
                log.warn("Notification SSE error: userId={}, error={}", user.getId(), e.getMessage());
            }
            cleanup.run();
        });

        try {
            userEmitter.trySend(SseEmitter.event()
                    .reconnectTime(3000L)
                    .comment("connected")
                    .name("init")
                    .data(Map.of("connected", true, "at", Instant.now().toString())));
        } catch (Exception e) {
            emitter.complete();
        }

        return emitter;
    }

    /**
     * Publishes a room event: persists to database as source of truth for monotonic ID,
     * then broadcasts through configured EventBus (local or PostgreSQL LISTEN/NOTIFY).
     */
    public void publish(UUID roomId, RoomEvent event) {
        if (roomId == null || event == null) return;
        eventBus.publish(event);
    }

    /**
     * Constructs and publishes a new durable event for a room.
     * Inserts into database off the request thread via virtual thread executor.
     */
    public void publish(UUID roomId, String topic, User actor, String entityId) {
        if (roomId == null) return;
        String safeTopic = topic != null ? topic : "room";
        String actorName = actor != null ? actor.getName() : "System";
        UUID actorId = actor != null ? actor.getId() : null;

        sseExecutor.submit(() -> {
            long seq;
            try {
                // Short independent transaction for durable event insert
                com.hackathonos.backend.events.RoomEvent saved = transactionTemplate.execute(status -> {
                    com.hackathonos.backend.events.RoomEvent dbEvent = new com.hackathonos.backend.events.RoomEvent(
                            roomId,
                            safeTopic,
                            safeTopic,
                            entityId != null ? entityId : roomId.toString(),
                            actorId
                    );
                    return eventRepository.save(dbEvent);
                });
                seq = (saved != null && saved.getId() != null) ? saved.getId() : nextSeq(roomId);
            } catch (Exception e) {
                log.warn("Database event insert failed, falling back to in-memory sequence for room {}: {}", roomId, e.getMessage());
                seq = nextSeq(roomId);
            }

            RoomEvent roomEvent = new RoomEvent(
                    seq,
                    safeTopic,
                    roomId,
                    actorId,
                    actorName,
                    entityId,
                    Instant.now()
            );
            publish(roomId, roomEvent);
        });
    }

    public void publish(UUID roomId, String eventType) {
        publish(roomId, eventType, null, null);
    }

    /**
     * Local fanout to emitters connected to this JVM instance.
     * Appends to hot in-memory ring buffer and pushes to open emitters using virtual threads.
     */
    public void fanoutLocal(RoomEvent event) {
        if (event == null || event.roomId() == null) return;
        UUID roomId = event.roomId();

        // Add to hot ring buffer cache
        Deque<RoomEvent> ringBuffer = roomRingBuffers.get(roomId, k -> new ConcurrentLinkedDeque<>());
        if (ringBuffer != null) {
            synchronized (ringBuffer) {
                while (ringBuffer.size() >= RING_BUFFER_SIZE) {
                    ringBuffer.pollFirst();
                }
                ringBuffer.addLast(event);
            }
        }

        List<UserEmitter> emitters = roomEmitters.get(roomId);
        if (emitters == null || emitters.isEmpty()) return;

        List<UserEmitter> snapshot = new ArrayList<>(emitters);
        sseExecutor.submit(() -> {
            List<UserEmitter> failed = new ArrayList<>();
            for (UserEmitter ue : snapshot) {
                boolean sent = ue.trySend(SseEmitter.event()
                        .id(String.valueOf(event.seq()))
                        .name("room")
                        .data(event));
                if (!sent) {
                    failed.add(ue);
                }
            }
            for (UserEmitter ue : failed) {
                try { ue.emitter().complete(); } catch (Exception e) { log.debug("Error completing emitter: {}", e.getMessage()); }
                removeRoomEmitter(roomId, ue);
            }
        });
    }

    public void publishUser(UUID userId, String topic) {
        if (userId == null) return;
        List<UserEmitter> emitters = notificationEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) return;

        List<UserEmitter> snapshot = new ArrayList<>(emitters);
        Map<String, Object> data = Map.of(
                "topic", topic != null ? topic : "rooms",
                "at", Instant.now().toString()
        );

        sseExecutor.submit(() -> {
            List<UserEmitter> failed = new ArrayList<>();
            for (UserEmitter ue : snapshot) {
                boolean sent = ue.trySend(SseEmitter.event().name("user").data(data));
                if (!sent) {
                    failed.add(ue);
                }
            }
            for (UserEmitter ue : failed) {
                try { ue.emitter().complete(); } catch (Exception e) { log.debug("Error completing emitter: {}", e.getMessage()); }
                removeNotificationEmitter(userId, ue);
            }
        });
    }

    public void publishNotification(UUID userId) {
        if (userId == null) return;
        List<UserEmitter> emitters = notificationEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) return;

        List<UserEmitter> snapshot = new ArrayList<>(emitters);
        Map<String, Object> data = Map.of(
                "topic", "notification",
                "type", "notification",
                "at", Instant.now().toString()
        );

        sseExecutor.submit(() -> {
            List<UserEmitter> failed = new ArrayList<>();
            for (UserEmitter ue : snapshot) {
                boolean sent1 = ue.trySend(SseEmitter.event().name("user").data(data));
                boolean sent2 = ue.trySend(SseEmitter.event().name("notification").data(data));
                if (!sent1 || !sent2) {
                    failed.add(ue);
                }
            }
            for (UserEmitter ue : failed) {
                try { ue.emitter().complete(); } catch (Exception e) { log.debug("Error completing emitter: {}", e.getMessage()); }
                removeNotificationEmitter(userId, ue);
            }
        });
    }

    public Set<UUID> onlineUserIds(UUID roomId) {
        return presenceService.getOnlineUserIds(roomId);
    }

    public boolean isUserOnline(UUID roomId, UUID userId) {
        return presenceService.isUserOnline(roomId, userId);
    }

    public boolean isUserOnlineAnywhere(UUID userId) {
        return presenceService.isUserOnlineAnywhere(userId);
    }

    private void schedulePresenceDebounce(UUID roomId) {
        presenceDebounceMap.asMap().compute(roomId, (k, existing) -> {
            if (existing != null && !existing.isDone()) {
                existing.cancel(false);
            }
            return scheduledExecutor.schedule(() -> {
                publish(roomId, "presence", null, null);
            }, 2, TimeUnit.SECONDS);
        });
    }

    /**
     * Replays missed events from database and hot cache, or emits 'resync' if gap exceeds 200.
     */
    private void replayEventsAfter(UUID roomId, long lastSeq, UserEmitter targetEmitter) {
        boolean needsResync = false;
        List<RoomEvent> toSend = new ArrayList<>();

        try {
            Optional<Long> oldestOpt = eventRepository.findOldestEventId(roomId);
            long countAfter = eventRepository.countEventsAfter(roomId, lastSeq);

            if (countAfter > 200 || (oldestOpt.isPresent() && lastSeq < oldestOpt.get())) {
                needsResync = true;
            } else {
                List<com.hackathonos.backend.events.RoomEvent> missed = eventRepository.findEventsAfter(roomId, lastSeq, PageRequest.of(0, 200));
                for (com.hackathonos.backend.events.RoomEvent ev : missed) {
                    toSend.add(new RoomEvent(
                            ev.getId(),
                            ev.getType(),
                            ev.getRoomId(),
                            ev.getActorUserId(),
                            "Member",
                            ev.getEntityId(),
                            ev.getCreatedAt()
                    ));
                }
            }
        } catch (Exception e) {
            log.warn("Database replay query failed, falling back to hot ring buffer: {}", e.getMessage());
            Deque<RoomEvent> ringBuffer = roomRingBuffers.getIfPresent(roomId);
            if (ringBuffer != null) {
                synchronized (ringBuffer) {
                    if (!ringBuffer.isEmpty()) {
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
                }
            }
        }

        if (needsResync) {
            long seq = nextSeq(roomId);
            RoomEvent resync = new RoomEvent(seq, "resync", roomId, null, "System", null, Instant.now());
            try {
                targetEmitter.trySend(SseEmitter.event().id(String.valueOf(seq)).name("room").data(resync));
            } catch (Exception ignored) {}
        } else {
            for (RoomEvent ev : toSend) {
                boolean sent = targetEmitter.trySend(SseEmitter.event().id(String.valueOf(ev.seq())).name("room").data(ev));
                if (!sent) break;
            }
        }
    }

    /**
     * Sends keep-alive ping comment every 15 seconds to prevent proxy socket timeout.
     */
    @Scheduled(fixedDelay = 15000)
    public void pingAll() {
        for (Map.Entry<UUID, List<UserEmitter>> entry : roomEmitters.entrySet()) {
            List<UserEmitter> failed = new ArrayList<>();
            for (UserEmitter ue : entry.getValue()) {
                boolean sent = ue.trySend(SseEmitter.event().comment("ping"));
                if (!sent) {
                    failed.add(ue);
                }
            }
            for (UserEmitter ue : failed) {
                try { ue.emitter().complete(); } catch (Exception e) { log.debug("Error completing emitter: {}", e.getMessage()); }
                removeRoomEmitter(entry.getKey(), ue);
            }
        }

        for (Map.Entry<UUID, List<UserEmitter>> entry : notificationEmitters.entrySet()) {
            List<UserEmitter> failed = new ArrayList<>();
            for (UserEmitter ue : entry.getValue()) {
                boolean sent = ue.trySend(SseEmitter.event().comment("ping"));
                if (!sent) {
                    failed.add(ue);
                }
            }
            for (UserEmitter ue : failed) {
                try { ue.emitter().complete(); } catch (Exception e) { log.debug("Error completing emitter: {}", e.getMessage()); }
                removeNotificationEmitter(entry.getKey(), ue);
            }
        }
    }

    /**
     * Periodically cleans up empty rooms from per-room structures.
     */
    @Scheduled(fixedRate = 300_000)
    public void pruneEmptyRooms() {
        roomEmitters.entrySet().removeIf(e -> e.getValue() == null || e.getValue().isEmpty());
        notificationEmitters.entrySet().removeIf(e -> e.getValue() == null || e.getValue().isEmpty());
    }

    @PreDestroy
    public void shutdown() {
        log.info("Graceful shutdown: notifying all active SSE connections with 'bye' event");
        for (List<UserEmitter> list : roomEmitters.values()) {
            for (UserEmitter ue : list) {
                try {
                    ue.trySend(SseEmitter.event().name("bye").data(Map.of("reason", "server_shutdown", "message", "Server is shutting down")));
                } catch (Exception e) {
                    log.debug("Failed sending shutdown bye event to room emitter: {}", e.getMessage());
                }
                try {
                    ue.emitter().complete();
                } catch (Exception e) {
                    log.debug("Error completing room emitter on shutdown: {}", e.getMessage());
                }
            }
        }
        roomEmitters.clear();
        for (List<UserEmitter> list : notificationEmitters.values()) {
            for (UserEmitter ue : list) {
                try {
                    ue.trySend(SseEmitter.event().name("bye").data(Map.of("reason", "server_shutdown", "message", "Server is shutting down")));
                } catch (Exception e) {
                    log.debug("Failed sending shutdown bye event to notification emitter: {}", e.getMessage());
                }
                try {
                    ue.emitter().complete();
                } catch (Exception e) {
                    log.debug("Error completing notification emitter on shutdown: {}", e.getMessage());
                }
            }
        }
        notificationEmitters.clear();
        sseExecutor.shutdown();
        scheduledExecutor.shutdown();
    }

    public int getActiveRoomEmittersCount() {
        int count = 0;
        for (List<UserEmitter> list : roomEmitters.values()) {
            count += list.size();
        }
        return count;
    }

    public int getActiveNotificationEmittersCount() {
        int count = 0;
        for (List<UserEmitter> list : notificationEmitters.values()) {
            count += list.size();
        }
        return count;
    }

    public int getActiveConnectionCount() {
        return getActiveRoomEmittersCount() + getActiveNotificationEmittersCount();
    }

    public Map<String, Object> getRealtimeStats() {
        Map<String, Integer> perRoom = new HashMap<>();
        for (Map.Entry<UUID, List<UserEmitter>> entry : roomEmitters.entrySet()) {
            if (!entry.getValue().isEmpty()) {
                perRoom.put(entry.getKey().toString(), entry.getValue().size());
            }
        }
        int notifCount = 0;
        for (List<UserEmitter> list : notificationEmitters.values()) {
            notifCount += list.size();
        }
        return Map.of(
                "totalConnections", getActiveConnectionCount(),
                "roomConnections", perRoom,
                "userNotificationStreams", notifCount,
                "busType", appProperties.getEvents().getBus()
        );
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

    private void removeNotificationEmitter(UUID userId, UserEmitter userEmitter) {
        List<UserEmitter> list = notificationEmitters.get(userId);
        if (list != null) {
            list.remove(userEmitter);
            if (list.isEmpty()) {
                notificationEmitters.remove(userId);
            }
        }
    }

    private boolean isExpectedDisconnect(Throwable t) {
        if (t == null) return false;
        String name = t.getClass().getName();
        if (name.contains("ClientAbortException") || name.contains("AsyncRequestTimeoutException")) {
            return true;
        }
        String msg = t.getMessage();
        if (msg != null) {
            String lower = msg.toLowerCase();
            if (lower.contains("broken pipe") || lower.contains("connection reset")
                    || lower.contains("connection was aborted") || lower.contains("closed by peer")) {
                return true;
            }
        }
        return isExpectedDisconnect(t.getCause());
    }
}
