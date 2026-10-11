package com.hackathonos.backend.checkpoints;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomCheckpointRepository extends JpaRepository<RoomCheckpoint, UUID> {
    List<RoomCheckpoint> findByRoomIdOrderByPositionAsc(UUID roomId);
    Optional<RoomCheckpoint> findByRoomIdAndRuleKey(UUID roomId, String ruleKey);
    List<RoomCheckpoint> findByPassedAtIsNullAndDueAtBetween(Instant start, Instant end);
}
