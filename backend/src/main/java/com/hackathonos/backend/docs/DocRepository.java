package com.hackathonos.backend.docs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocRepository extends JpaRepository<Doc, UUID> {
    List<Doc> findByRoomId(UUID roomId);
    List<Doc> findByRoomIdOrderByFileNameAsc(UUID roomId);
    Optional<Doc> findByRoomIdAndFileName(UUID roomId, String fileName);
    void deleteByRoomId(UUID roomId);
}
