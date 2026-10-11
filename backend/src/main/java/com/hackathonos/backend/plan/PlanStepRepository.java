package com.hackathonos.backend.plan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanStepRepository extends JpaRepository<PlanStep, UUID> {
    List<PlanStep> findByRoomId(UUID roomId);
    Optional<PlanStep> findByRoomIdAndStepKey(UUID roomId, String stepKey);
    void deleteByRoomId(UUID roomId);
}
