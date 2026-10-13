package com.hackathonos.backend.events;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Change feed event entity capturing room state mutations for live synchronization.
 */
@Entity
@Table(name = "room_events", indexes = {
        @Index(name = "idx_room_events_room_id_id", columnList = "room_id, id"),
        @Index(name = "idx_room_events_created_at", columnList = "created_at")
})
public class RoomEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(nullable = false, length = 64)
    private String type;

    @Column(name = "entity_type", nullable = false, length = 64)
    private String entityType;

    @Column(name = "entity_id", nullable = false, length = 128)
    private String entityId;

    @Column(name = "actor_user_id")
    private UUID actorUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected RoomEvent() {}

    public RoomEvent(UUID roomId, String type, String entityType, String entityId, UUID actorUserId) {
        this.roomId = roomId;
        this.type = type;
        this.entityType = entityType;
        this.entityId = entityId;
        this.actorUserId = actorUserId;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public UUID getRoomId() { return roomId; }
    public String getType() { return type; }
    public String getEntityType() { return entityType; }
    public String getEntityId() { return entityId; }
    public UUID getActorUserId() { return actorUserId; }
    public Instant getCreatedAt() { return createdAt; }
}
