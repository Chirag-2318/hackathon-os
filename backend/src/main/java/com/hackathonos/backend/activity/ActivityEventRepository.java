package com.hackathonos.backend.activity;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ActivityEventRepository extends JpaRepository<ActivityEvent, UUID> {
    List<ActivityEvent> findByRoomIdOrderByCreatedAtDesc(UUID roomId, Pageable pageable);
    List<ActivityEvent> findByRoomIdAndCreatedAtLessThanOrderByCreatedAtDesc(UUID roomId, Instant createdAt, Pageable pageable);
}
