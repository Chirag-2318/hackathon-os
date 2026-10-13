package com.hackathonos.backend.plan;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlanStepPromptRepository extends JpaRepository<PlanStepPrompt, UUID> {
    Optional<PlanStepPrompt> findByRoomIdAndStepIndex(UUID roomId, int stepIndex);
    List<PlanStepPrompt> findByRoomId(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
