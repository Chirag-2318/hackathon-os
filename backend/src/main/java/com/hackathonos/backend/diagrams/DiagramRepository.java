package com.hackathonos.backend.diagrams;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DiagramRepository extends JpaRepository<Diagram, UUID> {
    List<Diagram> findByRoomIdOrderByUpdatedAtDesc(UUID roomId);
    Optional<Diagram> findByRoomIdAndTitle(UUID roomId, String title);
    void deleteByRoomId(UUID roomId);
}
