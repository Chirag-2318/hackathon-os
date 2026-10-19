package com.hackathonos.backend.pitchkit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RehearsalRepository extends JpaRepository<Rehearsal, UUID> {

    List<Rehearsal> findByRoomIdOrderByCreatedAtDesc(UUID roomId);

    List<Rehearsal> findByRoomIdAndUserIdOrderByCreatedAtDesc(UUID roomId, UUID userId);

    Optional<Rehearsal> findByIdAndRoomId(UUID id, UUID roomId);

    @Query("SELECT COUNT(r) FROM Rehearsal r WHERE r.roomId = :roomId AND r.scope = 'FULL' AND r.completionPct >= 80 AND r.durationMs >= :minDurationMs")
    long countCountingRehearsals(@Param("roomId") UUID roomId, @Param("minDurationMs") long minDurationMs);
}
