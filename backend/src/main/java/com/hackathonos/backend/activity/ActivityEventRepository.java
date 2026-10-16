package com.hackathonos.backend.activity;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ActivityEventRepository extends JpaRepository<ActivityEvent, UUID> {
    List<ActivityEvent> findByRoomIdOrderByCreatedAtDesc(UUID roomId, Pageable pageable);
    List<ActivityEvent> findByRoomIdAndCreatedAtLessThanOrderByCreatedAtDesc(UUID roomId, Instant createdAt, Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE ActivityEvent ae SET ae.actorId = null WHERE ae.actorId = :actorId")
    void anonymizeByActorId(@org.springframework.data.repository.query.Param("actorId") UUID actorId);

    void deleteByRoomId(UUID roomId);
}
