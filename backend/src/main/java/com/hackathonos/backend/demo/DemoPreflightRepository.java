package com.hackathonos.backend.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DemoPreflightRepository extends JpaRepository<DemoPreflight, UUID> {
    List<DemoPreflight> findByRoomIdOrderByPositionAsc(UUID roomId);
    Optional<DemoPreflight> findByRoomIdAndItemHash(UUID roomId, String itemHash);
    void deleteByRoomId(UUID roomId);
}
