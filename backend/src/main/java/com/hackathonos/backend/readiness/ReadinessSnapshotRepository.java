package com.hackathonos.backend.readiness;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReadinessSnapshotRepository extends JpaRepository<ReadinessSnapshot, UUID> {
    List<ReadinessSnapshot> findTop20ByRoomIdOrderByCreatedAtDesc(UUID roomId);
    Optional<ReadinessSnapshot> findTopByRoomIdOrderByCreatedAtDesc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
