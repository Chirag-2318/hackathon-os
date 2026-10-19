package com.hackathonos.backend.pitch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QnaPracticeRepository extends JpaRepository<QnaPractice, QnaPractice.QnaPracticeId> {
    List<QnaPractice> findByUserIdAndRoomId(UUID userId, UUID roomId);
    Optional<QnaPractice> findByUserIdAndRoomIdAndQuestionHash(UUID userId, UUID roomId, String questionHash);
    void deleteByUserIdAndRoomIdAndQuestionHash(UUID userId, UUID roomId, String questionHash);
}
