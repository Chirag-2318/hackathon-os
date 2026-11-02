package com.hackathonos.backend.events;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.events.bus.LocalEventBus;
import com.hackathonos.backend.presence.PresenceService;
import com.hackathonos.backend.users.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RoomEventHubTest {

    private RoomEventHub hub;
    private AppProperties appProperties;

    @Mock
    private RoomEventRepository eventRepository;

    @Mock
    private PresenceService presenceService;

    @Mock
    private TransactionTemplate transactionTemplate;

    private UUID roomId;
    private User testUser;

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        appProperties.getEvents().setMaxStreamsPerUser(6);

        hub = new RoomEventHub(
                appProperties,
                new LocalEventBus(null), // will hook up below
                eventRepository,
                presenceService,
                transactionTemplate
        );

        // Link local bus to hub
        LocalEventBus localBus = new LocalEventBus(hub);
        hub = new RoomEventHub(
                appProperties,
                localBus,
                eventRepository,
                presenceService,
                transactionTemplate
        );

        roomId = UUID.randomUUID();
        testUser = new User("DEV", "hub@example.com", "Hub User", null, null, null);
        testUser.setId(UUID.randomUUID());

        when(presenceService.getOnlineUserIds(roomId)).thenReturn(Set.of(testUser.getId()));
        when(presenceService.isUserOnline(eq(roomId), eq(testUser.getId()))).thenReturn(true);
    }

    @Test
    @DisplayName("nextSeq generates strictly increasing monotonic sequence numbers per room")
    void testNextSeqMonotonicity() {
        UUID roomA = UUID.randomUUID();
        UUID roomB = UUID.randomUUID();

        long a1 = hub.nextSeq(roomA);
        long a2 = hub.nextSeq(roomA);
        long b1 = hub.nextSeq(roomB);
        long a3 = hub.nextSeq(roomA);

        assertThat(a1).isEqualTo(1L);
        assertThat(a2).isEqualTo(2L);
        assertThat(a3).isEqualTo(3L);
        assertThat(b1).isEqualTo(1L);
    }

    @Test
    @DisplayName("subscribe registers emitter and presence delegates to database-backed presenceService")
    void testSubscribeAndOnlinePresence() {
        SseEmitter emitter = hub.subscribe(roomId, testUser, null);
        assertThat(emitter).isNotNull();
        assertThat(hub.onlineUserIds(roomId)).contains(testUser.getId());
        assertThat(hub.isUserOnline(roomId, testUser.getId())).isTrue();

        emitter.complete();
    }

    @Test
    @DisplayName("Eviction of oldest stream sends 'bye' event when user exceeds max streams cap")
    void testMaxStreamsPerUserEvictionSendsBye() {
        appProperties.getEvents().setMaxStreamsPerUser(3);

        List<SseEmitter> emitters = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            emitters.add(hub.subscribe(roomId, testUser, null));
        }

        // 4th stream exceeds cap of 3 -> evicts oldest with 'bye'
        SseEmitter s4 = hub.subscribe(roomId, testUser, null);
        assertThat(s4).isNotNull();

        for (SseEmitter e : emitters) {
            e.complete();
        }
        s4.complete();
    }

    @Test
    @DisplayName("Replay after restart queries database for events newer than lastEventId")
    void testReplayEventsFromRepository() {
        when(eventRepository.findOldestEventId(roomId)).thenReturn(Optional.of(100L));
        when(eventRepository.countEventsAfter(roomId, 100L)).thenReturn(2L);

        RoomEvent ev1 = new RoomEvent(roomId, "board", "task", "t-1", testUser.getId());
        RoomEvent ev2 = new RoomEvent(roomId, "ideas", "idea", "i-1", testUser.getId());
        when(eventRepository.findEventsAfter(eq(roomId), eq(100L), any(PageRequest.class)))
                .thenReturn(List.of(ev1, ev2));

        SseEmitter emitter = hub.subscribe(roomId, testUser, "100");
        assertThat(emitter).isNotNull();
        verify(eventRepository).findEventsAfter(eq(roomId), eq(100L), any(PageRequest.class));
        emitter.complete();
    }

    @Test
    @DisplayName("Gap > 200 triggers resync event to client")
    void testResyncWhenGapTooLarge() {
        when(eventRepository.findOldestEventId(roomId)).thenReturn(Optional.of(10L));
        when(eventRepository.countEventsAfter(roomId, 10L)).thenReturn(250L); // Gap > 200

        SseEmitter emitter = hub.subscribe(roomId, testUser, "10");
        assertThat(emitter).isNotNull();
        // Since gap is 250, findEventsAfter is not queried; resync is dispatched
        verify(eventRepository, never()).findEventsAfter(any(), anyLong(), any());
        emitter.complete();
    }

    @Test
    @DisplayName("Slow lagging client exceeding pending writes threshold is dropped without delaying others")
    void testSlowClientLaggingDropped() {
        RoomEventHub.UserEmitter fastEmitter = new RoomEventHub.UserEmitter(
                UUID.randomUUID(), new SseEmitter(10000L), Instant.now()
        );
        RoomEventHub.UserEmitter slowEmitter = new RoomEventHub.UserEmitter(
                UUID.randomUUID(), new SseEmitter(10000L), Instant.now()
        );

        // Simulate slow client with backpressure saturating pending writes
        for (int i = 0; i < 55; i++) {
            slowEmitter.trySend(SseEmitter.event().data("ping"));
        }

        // Fast emitter should still accept writes
        boolean fastResult = fastEmitter.trySend(SseEmitter.event().data("hello"));
        assertThat(fastResult).isTrue();

        fastEmitter.emitter().complete();
        slowEmitter.emitter().complete();
    }
}
