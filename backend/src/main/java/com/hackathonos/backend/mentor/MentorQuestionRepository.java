package com.hackathonos.backend.mentor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MentorQuestionRepository extends JpaRepository<MentorQuestion, UUID> {
    List<MentorQuestion> findByRoomIdOrderByCreatedAtDesc(UUID roomId);
    long countByRoomIdAndStatus(UUID roomId, String status);
    void deleteByRoomId(UUID roomId);
}
