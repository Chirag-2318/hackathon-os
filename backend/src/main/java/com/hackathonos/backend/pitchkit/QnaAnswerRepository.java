package com.hackathonos.backend.pitchkit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QnaAnswerRepository extends JpaRepository<QnaAnswer, QnaAnswer.QnaAnswerId> {

    List<QnaAnswer> findByUserIdAndRoomId(UUID userId, UUID roomId);

    Optional<QnaAnswer> findByUserIdAndRoomIdAndHash(UUID userId, UUID roomId, String hash);

    List<QnaAnswer> findByRoomIdAndSharedTrue(UUID roomId);

    List<QnaAnswer> findByRoomIdAndHashAndSharedTrue(UUID roomId, String hash);
}
