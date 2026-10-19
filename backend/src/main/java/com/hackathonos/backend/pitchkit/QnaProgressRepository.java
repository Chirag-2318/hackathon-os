package com.hackathonos.backend.pitchkit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QnaProgressRepository extends JpaRepository<QnaProgress, QnaProgress.QnaProgressId> {

    List<QnaProgress> findByUserIdAndRoomId(UUID userId, UUID roomId);

    List<QnaProgress> findByRoomId(UUID roomId);

    Optional<QnaProgress> findByUserIdAndRoomIdAndHash(UUID userId, UUID roomId, String hash);

    @Query("SELECT p.hash, MAX(p.mastery) FROM QnaProgress p WHERE p.roomId = :roomId GROUP BY p.hash")
    List<Object[]> findTeamMasteryByRoomId(@Param("roomId") UUID roomId);
}
