package com.hackathonos.backend.presence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface RoomPresenceRepository extends JpaRepository<RoomPresence, RoomPresenceId> {

    @Modifying
    @Query(value = """
        INSERT INTO room_presence (room_id, user_id, last_seen)
        VALUES (:roomId, :userId, :now)
        ON CONFLICT (room_id, user_id)
        DO UPDATE SET last_seen = EXCLUDED.last_seen
        """, nativeQuery = true)
    void upsertHeartbeat(@Param("roomId") UUID roomId, @Param("userId") UUID userId, @Param("now") Instant now);

    @Query("SELECT p.userId FROM RoomPresence p WHERE p.roomId = :roomId AND p.lastSeen >= :cutoff")
    List<UUID> findActiveUserIds(@Param("roomId") UUID roomId, @Param("cutoff") Instant cutoff);

    @Query("SELECT COUNT(p) > 0 FROM RoomPresence p WHERE p.roomId = :roomId AND p.userId = :userId AND p.lastSeen >= :cutoff")
    boolean isUserOnline(@Param("roomId") UUID roomId, @Param("userId") UUID userId, @Param("cutoff") Instant cutoff);

    @Query("SELECT COUNT(p) > 0 FROM RoomPresence p WHERE p.userId = :userId AND p.lastSeen >= :cutoff")
    boolean isUserOnlineAnywhere(@Param("userId") UUID userId, @Param("cutoff") Instant cutoff);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM RoomPresence p WHERE p.lastSeen < :cutoff")
    int pruneOlderThan(@Param("cutoff") Instant cutoff);
}

