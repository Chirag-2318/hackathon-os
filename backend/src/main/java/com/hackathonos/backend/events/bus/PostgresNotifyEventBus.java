package com.hackathonos.backend.events.bus;

import com.hackathonos.backend.events.RoomEventHub;
import com.hackathonos.backend.events.RoomEventHub.RoomEvent;
import com.hackathonos.backend.events.RoomEventRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.postgresql.PGConnection;
import org.postgresql.PGNotification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.simple.JdbcClient;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Multi-instance event bus using PostgreSQL LISTEN/NOTIFY.
 * Enables horizontal scale across multiple backend containers.
 * Uses 1 dedicated non-pooled JDBC connection per container for LISTEN.
 */
public class PostgresNotifyEventBus implements EventBus {

    private static final Logger log = LoggerFactory.getLogger(PostgresNotifyEventBus.class);
    public static final String CHANNEL_NAME = "room_events_channel";

    private final RoomEventHub eventHub;
    private final JdbcClient jdbcClient;
    private final Environment environment;
    private final RoomEventRepository eventRepository;

    private final AtomicBoolean running = new AtomicBoolean(false);
    private final ExecutorService listenerExecutor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "postgres-listen-worker");
        t.setDaemon(true);
        return t;
    });

    public PostgresNotifyEventBus(RoomEventHub eventHub,
                                  JdbcClient jdbcClient,
                                  Environment environment,
                                  RoomEventRepository eventRepository) {
        this.eventHub = eventHub;
        this.jdbcClient = jdbcClient;
        this.environment = environment;
        this.eventRepository = eventRepository;
    }

    @PostConstruct
    public void startListener() {
        running.set(true);
        listenerExecutor.submit(this::listenLoop);
        log.info("PostgresNotifyEventBus started listening on channel '{}'", CHANNEL_NAME);
    }

    @PreDestroy
    public void stopListener() {
        running.set(false);
        listenerExecutor.shutdownNow();
    }

    @Override
    public void publish(RoomEvent event) {
        if (event == null || event.roomId() == null) return;
        try {
            // Channel payload: roomId|eventId|topic|actorName
            String payload = String.format("%s|%d|%s|%s",
                    event.roomId(),
                    event.seq(),
                    event.topic() != null ? event.topic() : "",
                    event.actorName() != null ? event.actorName() : "");
            jdbcClient.sql("SELECT pg_notify(:channel, :payload)")
                    .param("channel", CHANNEL_NAME)
                    .param("payload", payload)
                    .query().singleValue();
        } catch (Exception e) {
            log.warn("Failed to send pg_notify for event {}: {}", event.seq(), e.getMessage());
            // Fallback to local fanout so single-instance never loses events
            eventHub.fanoutLocal(event);
        }
    }

    private void listenLoop() {
        String url = environment.getProperty("spring.datasource.url");
        String user = environment.getProperty("spring.datasource.username");
        String pass = environment.getProperty("spring.datasource.password");

        while (running.get()) {
            try (Connection conn = DriverManager.getConnection(url, user, pass)) {
                PGConnection pgConn = conn.unwrap(PGConnection.class);
                try (Statement stmt = conn.createStatement()) {
                    stmt.execute("LISTEN " + CHANNEL_NAME);
                }
                log.info("Connected dedicated JDBC LISTEN connection for channel '{}'", CHANNEL_NAME);

                while (running.get() && !conn.isClosed()) {
                    PGNotification[] notifications = pgConn.getNotifications(5000);
                    if (notifications != null && notifications.length > 0) {
                        for (PGNotification n : notifications) {
                            handleNotification(n.getParameter());
                        }
                    }
                }
            } catch (Exception e) {
                if (running.get()) {
                    log.warn("Postgres LISTEN connection lost, reconnecting in 3s: {}", e.getMessage());
                    try {
                        Thread.sleep(3000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
    }

    private void handleNotification(String payload) {
        if (payload == null || payload.isBlank()) return;
        try {
            String[] parts = payload.split("\\|", 4);
            if (parts.length < 3) return;

            UUID roomId = UUID.fromString(parts[0]);
            long eventId = Long.parseLong(parts[1]);
            String topic = parts[2];
            String actorName = parts.length > 3 ? parts[3] : "System";

            RoomEvent event = eventRepository.findById(eventId)
                    .map(saved -> new RoomEvent(
                            saved.getId(),
                            saved.getType(),
                            saved.getRoomId(),
                            saved.getActorUserId(),
                            actorName,
                            saved.getEntityId(),
                            saved.getCreatedAt()
                    ))
                    .orElseGet(() -> new RoomEvent(eventId, topic, roomId, null, actorName, null, Instant.now()));

            eventHub.fanoutLocal(event);
        } catch (Exception e) {
            log.warn("Error processing PG notification '{}': {}", payload, e.getMessage());
        }
    }
}
