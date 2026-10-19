package com.hackathonos.backend.pitchkit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QnaSessionAnswerRepository extends JpaRepository<QnaSessionAnswer, UUID> {

    List<QnaSessionAnswer> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);

    Optional<QnaSessionAnswer> findBySessionIdAndHash(UUID sessionId, String hash);
}
