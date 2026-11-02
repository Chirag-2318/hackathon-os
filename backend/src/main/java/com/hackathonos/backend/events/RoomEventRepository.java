package com.hackathonos.backend.events;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomEventRepository extends JpaRepository<RoomEvent, Long> {

    @Query("SELECT e FROM RoomEvent e WHERE e.roomId = :roomId AND e.id > :after ORDER BY e.id ASC")
    List<RoomEvent> findEventsAfter(@Param("roomId") UUID roomId, @Param("after") long after, Pageable pageable);

    @Query("SELECT MAX(e.id) FROM RoomEvent e WHERE e.roomId = :roomId")
    Optional<Long> findLatestEventId(@Param("roomId") UUID roomId);

    @Query("SELECT MIN(e.id) FROM RoomEvent e WHERE e.roomId = :roomId")
    Optional<Long> findOldestEventId(@Param("roomId") UUID roomId);

    @Query("SELECT COUNT(e) FROM RoomEvent e WHERE e.roomId = :roomId AND e.id > :after")
    long countEventsAfter(@Param("roomId") UUID roomId, @Param("after") long after);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM RoomEvent e WHERE e.createdAt < :cutoff")
    int pruneOlderThan(@Param("cutoff") Instant cutoff);
}
