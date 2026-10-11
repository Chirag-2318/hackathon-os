package com.hackathonos.backend.crowdcheck;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrowdRowRepository extends JpaRepository<CrowdRow, UUID> {
    List<CrowdRow> findByRoomIdOrderByTitleAsc(UUID roomId);
    Optional<CrowdRow> findByRoomIdAndIdeaId(UUID roomId, UUID ideaId);
    void deleteByRoomId(UUID roomId);
}
