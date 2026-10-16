package com.hackathonos.backend.plan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanPhaseRepository extends JpaRepository<PlanPhase, UUID> {
    List<PlanPhase> findByRoomIdOrderByPositionAsc(UUID roomId);
    Optional<PlanPhase> findByRoomIdAndPlanKey(UUID roomId, String planKey);
    Optional<PlanPhase> findByRoomIdAndStatus(UUID roomId, String status);
    void deleteByRoomId(UUID roomId);
}
