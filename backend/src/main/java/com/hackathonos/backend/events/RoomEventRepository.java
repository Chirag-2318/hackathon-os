package com.hackathonos.backend.events;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomEventRepository extends JpaRepository<RoomEvent, Long> {

    @Query("SELECT e FROM RoomEvent e WHERE e.roomId = :roomId AND e.id > :after ORDER BY e.id ASC")
    List<RoomEvent> findEventsAfter(@Param("roomId") UUID roomId, @Param("after") long after, Pageable pageable);

    @Query("SELECT MAX(e.id) FROM RoomEvent e WHERE e.roomId = :roomId")
    Optional<Long> findLatestEventId(@Param("roomId") UUID roomId);
}
