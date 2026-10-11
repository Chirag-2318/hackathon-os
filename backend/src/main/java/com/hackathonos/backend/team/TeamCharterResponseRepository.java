package com.hackathonos.backend.team;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamCharterResponseRepository extends JpaRepository<TeamCharterResponse, UUID> {
    List<TeamCharterResponse> findByRoomId(UUID roomId);
    Optional<TeamCharterResponse> findByRoomIdAndUserId(UUID roomId, UUID userId);
}
