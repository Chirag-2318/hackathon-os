package com.hackathonos.backend.readiness;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReadinessSimulationRepository extends JpaRepository<ReadinessSimulation, UUID> {
    Optional<ReadinessSimulation> findTopByRoomIdOrderByCreatedAtDesc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
