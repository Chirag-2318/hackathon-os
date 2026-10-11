package com.hackathonos.backend.submission;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubmissionLinkRepository extends JpaRepository<SubmissionLink, UUID> {
    List<SubmissionLink> findByRoomIdOrderByLabelAsc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
