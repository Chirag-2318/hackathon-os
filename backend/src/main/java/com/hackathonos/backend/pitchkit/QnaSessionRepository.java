package com.hackathonos.backend.pitchkit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QnaSessionRepository extends JpaRepository<QnaSession, UUID> {

    Optional<QnaSession> findByIdAndRoomId(UUID id, UUID roomId);

    List<QnaSession> findByRoomIdAndUserIdOrderByCreatedAtDesc(UUID roomId, UUID userId);
}
