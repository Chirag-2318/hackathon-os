package com.hackathonos.backend.events;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.events.bus.PostgresNotifyEventBus;
import com.hackathonos.backend.presence.PresenceService;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class RealtimeIntegrationTest {

    @Autowired private AppProperties appProperties;
    @Autowired private RoomEventRepository eventRepository;
    @Autowired private PresenceService presenceService;
    @Autowired private TransactionTemplate transactionTemplate;
    @Autowired private JdbcClient jdbcClient;
    @Autowired private Environment environment;
    @Autowired private RoomRepository roomRepository;
    @Autowired private UserRepository userRepository;

    private PostgresNotifyEventBus busA;
    private PostgresNotifyEventBus busB;
    private RoomEventHub hubA;
    private RoomEventHub hubB;

    private Room testRoom;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = userRepository.save(new User("DEV", "realtime-user-" + UUID.randomUUID() + "@example.com", "Realtime User", null, null, null));
        Room r = new Room();
        r.setName("Realtime Test Room");
        r.setOwnerId(testUser.getId());
        r.setJoinCode("RT" + UUID.randomUUID().toString().substring(0, 6));
        testRoom = roomRepository.save(r);

        // Create Instance A
        hubA = new RoomEventHub(appProperties, null, eventRepository, presenceService, transactionTemplate);
        busA = new PostgresNotifyEventBus(hubA, jdbcClient, environment, eventRepository);
        hubA.setEventBus(busA);

        // Create Instance B
        hubB = new RoomEventHub(appProperties, null, eventRepository, presenceService, transactionTemplate);
        busB = new PostgresNotifyEventBus(hubB, jdbcClient, environment, eventRepository);
        hubB.setEventBus(busB);

        busA.startListener();
        busB.startListener();
    }

    @AfterEach
    void tearDown() {
        if (busA != null) busA.stopListener();
        if (busB != null) busB.stopListener();
        if (hubA != null) hubA.shutdown();
        if (hubB != null) hubB.shutdown();
    }

    @Test
    @DisplayName("Two instances in cluster: publish on Instance A reaches subscriber on Instance B via LISTEN/NOTIFY")
    void testTwoInstanceDelivery() throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        List<Object> receivedEvents = new CopyOnWriteArrayList<>();

        // Create subscriber on Instance B
        SseEmitter emitterOnB = new SseEmitter(30000L) {
            @Override
            public synchronized void send(SseEventBuilder builder) {
                receivedEvents.add(builder);
                if (receivedEvents.size() > 1) {
                    latch.countDown();
                }
            }
        };

        // Wire emitterOnB into hubB
        hubB.subscribe(testRoom.getId(), testUser, null, emitterOnB);

        // Allow LISTEN connection to subscribe
        Thread.sleep(800);

        // Publish event on Instance A
        RoomEventHub.RoomEvent publishedEvent = new RoomEventHub.RoomEvent(
                9999L,
                "board",
                testRoom.getId(),
                testUser.getId(),
                "Instance A User",
                "task-inst-1",
                Instant.now()
        );
        busA.publish(publishedEvent);

        boolean reached = latch.await(6, TimeUnit.SECONDS);
        assertThat(reached).isTrue();
        assertThat(receivedEvents).isNotEmpty();
    }

    @Test
    @DisplayName("Presence table records heartbeat and queries active users within 90s cutoff")
    void testPresencePersistenceAndCutoff() {
        UUID rId = testRoom.getId();
        UUID uId = testUser.getId();

        // Send heartbeat
        presenceService.heartbeat(rId, uId);

        Set<UUID> onlineUsers = presenceService.getOnlineUserIds(rId);
        assertThat(onlineUsers).contains(uId);
        assertThat(presenceService.isUserOnline(rId, uId)).isTrue();
        assertThat(presenceService.isUserOnlineAnywhere(uId)).isTrue();
    }
}
